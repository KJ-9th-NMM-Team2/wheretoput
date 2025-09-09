import React, { useRef, useEffect, useMemo } from "react";
import {
  useGLTF,
  useTexture,
  Line,
  MeshRefractionMaterial,
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useObjectControls } from "@/components/sim/mainsim/useObjectControls";
import { useStore } from "@/components/sim/useStore";
import { ModelTooltip } from "@/components/sim/collaboration/CollaborationIndicators";
import { useCallback } from "react";

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

  // GLB 모델 로드 (url이 유효하지 않으면 기본값 사용)
  const validUrl =
    url && typeof url === "string" ? url : "/legacy_mesh (1).glb";
  const { scene, animations } = useGLTF(validUrl);

  const isSelected = selectedModelId === modelId;
  const isHovering = hoveringModelId === modelId;

  const originalSizeRef = useRef([1, 1, 1]);
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

      // 회전 고려한 실제 바운딩 박스 크기 계산
      const rotationY = meshRef.current.rotation.y;
      
      // 90도 단위 회전이므로 sin, cos 값이 0, 1, -1 중 하나
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
    meshRef
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

      // 목표 크기로 스케일 조정
      const targetScale = safeScale.map(
        (target, i) => target / modelSize.getComponent(i)
      );

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
          rotation={rotation}
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
          rotation={rotation}
          scale={safeScale}
        >
          <primitive object={scene.clone()} />

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
}) {
  const points = useMemo(() => {
    const [w, h, d] = originalSizeRef;

    const vertices = [
      [-w / 2, -h / 2, -d / 2],
      [w / 2, -h / 2, -d / 2],
      [w / 2, h / 2, -d / 2],
      [-w / 2, h / 2, -d / 2],
      [-w / 2, -h / 2, d / 2],
      [w / 2, -h / 2, d / 2],
      [w / 2, h / 2, d / 2],
      [-w / 2, h / 2, d / 2],
    ];

    const edges = [
      [0, 1],
      [2, 3],
      [0, 4],
      [5, 6],
      [7, 4],
      [5, 1],
      [2, 6],
      [7, 3],
    ];

    return edges
      .flatMap(([start, end]) => [vertices[start], vertices[end]])
      .flat();
  }, [getSelectionBoxSize, originalSizeRef]);

  // 색상 결정: 스냅 중이면 주황색, 선택됨이면 파란색, 호버면 청록색
  const getColor = () => {
    if (isSnappedToWall) return "#ff8c00"; // 주황색 (스냅 상태)
    if (isSelected) return "#0000ff"; // 파란색 (선택됨)
    return "#00eeff"; // 청록색 (호버)
  };

  return <Line points={points} color={getColor()} lineWidth={lineWidth} />;
}
