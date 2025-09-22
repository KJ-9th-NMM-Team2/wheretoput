import React, {
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useTexture, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { useObjectControls } from "@/components/sim/mainsim/hooks/useObjectControls";
import { useStore } from "@/components/sim/useStore";
import { ModelTooltip } from "@/components/sim/collaboration/CollaborationIndicators";
import { PreviewBox } from "@/components/sim/preview/PreviewBox";
import { convertS3ToCdnUrl } from "@/lib/api/api-url";
import { useBase64ToArrayBuffer } from "./hooks/useBase64ToArrayBuffer";

export function DraggableModel({
  modelId,
  url,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  length = [1, 1, 1],
  controlsRef,
  texturePath = null,
  type = "glb",
  // onModelLoaded,
  glbData,
}) {
  // scale 값을 안전하게 처리
  const safeScale = (() => {
    const scaleArray = Array.isArray(scale) ? scale : [scale, scale, scale];
    const lengthArray = Array.isArray(length)
      ? length
      : [length, length, length];

    return scaleArray.map((s, i) =>
      Math.max((s || 1) * (lengthArray[i] || 1) * 0.001, 0.001)
    );
  })();

  const meshRef = useRef();

  // Zustand 스토어 사용
  const {
    viewOnly,
    selectedModelId,
    hoveringModelId,
    selectModel,
    hoveringModel,
    updateModelPosition,
    updateModelRotation,
    updateModelScale,
    setSnappedWallInfo,
  } = useStore();

  // DraggableModel에서
  const [glbDataUrl, setGlbDataUrl] = useState(null);

  // ********* 이게 urlGltf *********
  // GLB 모델 로드 (url이 있을 때만 로드)
  // const hasValidUrl =
  //   url && typeof url === "string" && url !== "/legacy_mesh (1).glb";
  // const urlGltf = hasValidUrl ? useGLTF(convertS3ToCdnUrl(url)) : null;
  // ********* 이게 urlGltf *********

  // glbData가 있으면 캐시 우선, 없으면 URL 사용
  const hasGlbData = Boolean(glbData);
  const hasValidUrl =
    url && typeof url === "string" && url !== "/legacy_mesh (1).glb";

  // glbData가 있으면 캐시 로딩을 기다리고, 없으면 바로 URL 사용
  const shouldLoadFromUrl = !hasGlbData && hasValidUrl;
  const urlGltf = shouldLoadFromUrl ? useGLTF(convertS3ToCdnUrl(url)) : null;

  // Base64 처리 Blob url로 변환
  useBase64ToArrayBuffer({ glbData, modelId, setGlbDataUrl });
  const glbGltf = glbDataUrl ? useGLTF(glbDataUrl) : null;

  // 디버깅용 로깅
  useEffect(() => {
    if (glbGltf) {
      console.log(glbDataUrl, "GLB 사용 중");
    } else if (urlGltf) {
      console.log(modelId, "URL 사용 중");
    } else {
      console.log(modelId, "모델 없음");
    }
  }, [glbGltf, urlGltf]); // , urlGltf

  // 우선순위 적용
  const { scene, animations } = glbGltf ||
    urlGltf || { scene: null, animations: null };

  const isSelected = selectedModelId === modelId;
  const isHovering = hoveringModelId === modelId;

  const originalSizeRef = useRef([1, 1, 1]);
  const [needsRotation, setNeedsRotation] = useState(false);
  // 선택 표시 박스 크기 결정 (회전 고려)
  const getSelectionBoxSize = useCallback(() => {
    if (!meshRef.current) {
      return [1, 1, 1]; // 기본값
    }

    try {
      const [ox, oy, oz] = originalSizeRef.current;
      const sx = meshRef.current.scale.x;
      const sy = meshRef.current.scale.y;
      const sz = meshRef.current.scale.z;

      // 회전 고려한 실제 바운딩 박스 크기 계산 (needsRotation 포함)
      const rotationY =
        meshRef.current.rotation.y + (needsRotation ? (Math.PI * 3) / 2 : 0);

      // 회전 각도에 따라 sin, cos 값을 사용하여 바운딩 박스 크기를 계산 (임의의 각도 지원)
      const cos = Math.cos(rotationY);
      const sin = Math.sin(rotationY);

      // 회전된 바운딩 박스 크기 (절댓값으로 계산)
      const rotatedWidth = Math.abs(ox * cos) + Math.abs(oz * sin);
      const rotatedDepth = Math.abs(ox * sin) + Math.abs(oz * cos);

      return [
        Math.max(rotatedWidth * sx, 0.001),
        Math.max(oy * sy, 0.001),
        Math.max(rotatedDepth * sz, 0.001),
      ];
    } catch (error) {
      console.warn("Failed to calculate selection box size:", error);
      return [1, 1, 1];
    }
  }, [scene]);

  // 객체 조작 훅 사용
  const {
    isDragging,
    isScaling,
    isSnappedToWall,
    snappedWallInfo,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerOver,
    handlePointerOut,
  } = useObjectControls(
    modelId,
    updateModelPosition,
    updateModelRotation,
    updateModelScale,
    selectModel,
    hoveringModel,
    controlsRef,
    getSelectionBoxSize,
    meshRef,
    needsRotation
  );
  const texture = texturePath ? useTexture(texturePath) : null;

  // 모델 설정 (그림자, 클릭 이벤트, 텍스처)
  useEffect(() => {
    if (scene && meshRef.current) {
      // console.log(`Setting up model ${modelId} with scale:`, safeScale);

      // 모델의 실제 크기 측정
      const box = new THREE.Box3().setFromObject(scene);
      const modelSize = new THREE.Vector3();
      box.getSize(modelSize);
      originalSizeRef.current = [modelSize.x, modelSize.y, modelSize.z];

      // GLTF 실제 크기와 length 배열 매핑하여 스케일 조정
      const actualW = modelSize.x,
        actualD = modelSize.z;
      const lengthW = Number(length[0]) || 0,
        lengthD = Number(length[2]) || 0;

      // 큰 것끼리, 작은 것끼리 매핑
      const [mappedX, mappedZ] =
        actualW >= actualD
          ? [Math.max(lengthW, lengthD), Math.min(lengthW, lengthD)]
          : [Math.min(lengthW, lengthD), Math.max(lengthW, lengthD)];

      const rotationNeeded =
        (lengthW > lengthD && actualW < actualD) ||
        (lengthW < lengthD && actualW > actualD);
      setNeedsRotation(rotationNeeded);

      // 기본 크기 조정 (length 기반)
      const lengthH = Number(length[1]) || 0;
      const baseScale = [
        (mappedX * 0.001) / actualW,
        (lengthH * 0.001) / modelSize.y,
        (mappedZ * 0.001) / actualD,
      ];

      // 사용자 스케일을 추가로 적용
      const currentScale = Array.isArray(scale) ? scale : [scale, scale, scale];
      const targetScale = [
        baseScale[0] * currentScale[0],
        baseScale[1] * currentScale[1],
        baseScale[2] * currentScale[2],
      ];

      meshRef.current.scale.set(...targetScale);

      // 바운딩 박스를 업데이트하고 바닥 위치 조정
      box.setFromObject(scene);
      const min = box.min;
      const yOffset = -min.y * targetScale[1]; // 바닥이 y=0에 닿도록 오프셋 계산

      // 기존 position에 y 오프셋 추가
      const adjustedPosition = [
        position[0],
        position[1] + yOffset,
        position[2],
      ];
      meshRef.current.position.set(...adjustedPosition);

      meshRef.current.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.userData.modelId = modelId;
          child.userData.clickable = true;
          child.visible = true; // 명시적으로 visible 설정

          // 재질이 투명하지 않도록 확인
          if (child.material) {
            if (
              child.material.transparent === undefined ||
              child.material.opacity === 0
            ) {
              child.material.transparent = false;
              child.material.opacity = 1;
            }
            child.material.needsUpdate = true;
          }
        }
      });

      // 전체 group도 visible 설정
      meshRef.current.visible = true;
    }
  }, [scene, animations, modelId, texture, type, safeScale]);

  // PreviewBox일 때 originalSizeRef 설정
  useEffect(() => {
    if (!scene) {
      // scene이 없을 때는 safeScale을 직접 사용
      originalSizeRef.current = [1, 1, 1]; // PreviewBox는 size=[1,1,1]이므로
    }
  }, [scene, safeScale]);

  // 전역 이벤트 리스너
  useEffect(() => {
    if (isDragging || isScaling) {
      const handleMouseMove = (e) => handlePointerMove(e);
      const handleMouseUp = () => handlePointerUp();

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isScaling, handlePointerMove, handlePointerUp]);

  // 스냅된 벽 정보를 전역 상태로 업데이트
  useEffect(() => {
    setSnappedWallInfo(snappedWallInfo);
  }, [snappedWallInfo, setSnappedWallInfo]);

  // 히스토리 시스템에서 오는 이벤트 리스너
  useEffect(() => {
    const handleHistoryMove = (event) => {
      const { furnitureId, position } = event.detail;
      if (furnitureId === modelId) {
        updateModelPosition(modelId, position);
      }
    };

    const handleHistoryRotate = (event) => {
      const { furnitureId, rotation } = event.detail;
      if (furnitureId === modelId) {
        updateModelRotation(modelId, rotation);
      }
    };

    const handleHistoryScale = (event) => {
      const { furnitureId, scale } = event.detail;
      if (furnitureId === modelId) {
        updateModelScale(modelId, scale);
      }
    };

    window.addEventListener("historyMoveFurniture", handleHistoryMove);
    window.addEventListener("historyRotateFurniture", handleHistoryRotate);
    window.addEventListener("historyScaleFurniture", handleHistoryScale);

    return () => {
      window.removeEventListener("historyMoveFurniture", handleHistoryMove);
      window.removeEventListener("historyRotateFurniture", handleHistoryRotate);
      window.removeEventListener("historyScaleFurniture", handleHistoryScale);
    };
  }, [modelId, updateModelPosition, updateModelRotation, updateModelScale]);

  return (
    <>
      {viewOnly ? (
        <group
          ref={meshRef}
          position={position}
          rotation={[
            rotation[0],
            rotation[1] + (needsRotation ? (Math.PI * 3) / 2 : 0),
            rotation[2],
          ]}
          scale={safeScale}
        >
          <primitive object={scene.clone()} />
          <ModelTooltip
            modelId={modelId}
            position={position}
            boundingBox={scene ? new THREE.Box3().setFromObject(scene) : null}
          />
        </group>
      ) : (
        <group
          ref={meshRef}
          position={position}
          rotation={[
            rotation[0],
            rotation[1] + (needsRotation ? (Math.PI * 3) / 2 : 0),
            rotation[2],
          ]}
          scale={safeScale}
        >
          {scene ? (
            <primitive object={scene.clone()} />
          ) : (
            <PreviewBox
              position={[0, 0, 0]}
              size={[1, 1, 1]}
              isLoading={false}
            />
          )}

          {/* 투명한 클릭/호버 감지 영역 */}
          <mesh
            onPointerDown={handlePointerDown}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={originalSizeRef.current} />
            <meshBasicMaterial transparent={true} opacity={0} visible={false} />
          </mesh>

          {(isSelected || isHovering) && (
            <SelectionBox
              isSelected={isSelected}
              isSnappedToWall={isSnappedToWall}
              getSelectionBoxSize={getSelectionBoxSize}
              originalSizeRef={originalSizeRef.current}
              isPreviewBox={!scene}
            />
          )}

          <ModelTooltip
            modelId={modelId}
            position={position}
            boundingBox={scene ? new THREE.Box3().setFromObject(scene) : null}
          />
        </group>
      )}
    </>
  );
}

function SelectionBox({
  isSelected,
  isSnappedToWall,
  getSelectionBoxSize,
  lineWidth = 3,
  originalSizeRef,
  isPreviewBox = false,
}) {
  const edges = useMemo(() => {
    const [w, h, d] = originalSizeRef;

    const vertices = [
      [-w / 2, -h / 2, -d / 2], // 0
      [w / 2, -h / 2, -d / 2], // 1
      [w / 2, h / 2, -d / 2], // 2
      [-w / 2, h / 2, -d / 2], // 3
      [-w / 2, -h / 2, d / 2], // 4
      [w / 2, -h / 2, d / 2], // 5
      [w / 2, h / 2, d / 2], // 6
      [-w / 2, h / 2, d / 2], // 7
    ];

    // 대각선 없이 박스 모서리만
    const edgeIndices = [
      // 앞면
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      // 뒷면
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      // 연결선
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ];

    const positions = [];
    edgeIndices.forEach(([start, end]) => {
      positions.push(...vertices[start], ...vertices[end]);
    });

    return new Float32Array(positions);
  }, [originalSizeRef]);

  // 색상 결정: 스냅 중이면 주황색, 선택됨이면 파란색, 호버면 청록색
  const getColor = () => {
    if (isSnappedToWall) return "#ff8c00"; // 주황색 (스냅 상태)
    if (isSelected) return "#0000ff"; // 파란색 (선택됨)
    return "#00eeff"; // 청록색 (호버)
  };

  return (
    <lineSegments
      castShadow={false}
      receiveShadow={false}
      position={isPreviewBox ? [0, 0.5, 0] : [0, 0, 0]}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={edges.length / 3}
          array={edges}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={getColor()} />
    </lineSegments>
  );
}
