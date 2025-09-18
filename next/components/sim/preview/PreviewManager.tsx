import React, { useRef, useEffect, useState, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "@/components/sim/useStore";
import { PreviewBox } from "./PreviewBox";

// 실제 GLB 모델 프리뷰 컴포넌트
function GLBPreview({
  url,
  position,
  scale,
  onLoad,
  onLoadingComplete,
}: {
  url: string;
  position: [number, number, number];
  scale: [number, number, number];
  onLoad?: () => void;
  onLoadingComplete?: () => void;
}) {
  const { scene } = useGLTF(url);
  const meshRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (scene && meshRef.current) {
      // 모델의 실제 크기 측정
      const box = new THREE.Box3().setFromObject(scene);
      const modelSize = new THREE.Vector3();
      box.getSize(modelSize);

      // GLTF 실제 크기와 length 배열 매핑하여 스케일 조정
      const actualW = modelSize.x,
        actualD = modelSize.z;
      const lengthW = scale[0] / 0.001, // scale에서 역산하여 length 값 구하기
        lengthD = scale[2] / 0.001;

      // 큰 것끼리, 작은 것끼리 매핑
      const [mappedX, mappedZ] =
        actualW >= actualD
          ? [Math.max(lengthW, lengthD), Math.min(lengthW, lengthD)]
          : [Math.min(lengthW, lengthD), Math.max(lengthW, lengthD)];

      // 회전 조건: width와 depth가 뒤바뀐 경우
      const needsRotation = (lengthW > lengthD && actualW < actualD) || (lengthW < lengthD && actualW > actualD);

      const targetScale = [
        (mappedX * 0.001) / actualW,
        scale[1] / modelSize.y,
        (mappedZ * 0.001) / actualD,
      ];

      meshRef.current.scale.set(targetScale[0], targetScale[1], targetScale[2]);

      // 필요시 270도 회전
      if (needsRotation) {
        meshRef.current.rotation.y = (Math.PI * 3) / 2;
      }

      // 바닥 위치 조정
      const min = box.min;
      const yOffset = -min.y * targetScale[1];
      meshRef.current.position.set(
        position[0],
        position[1] + yOffset,
        position[2]
      );

      // 투명도 적용
      scene.traverse((child) => {
        if ((child as any).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material = mesh.material.map((mat) => {
                const clonedMat = mat.clone();

                return clonedMat;
              });
            } else {
              mesh.material = mesh.material.clone();
            }
          }
        }
      });

      // 로딩 완료 콜백 호출
      if (onLoadingComplete) {
        onLoadingComplete();
      }
    }
  }, [scene, position, scale, onLoadingComplete]);

  return (
    <group ref={meshRef}>
      <primitive object={scene.clone()} />
    </group>
  );
}

export function PreviewManager() {
  const { camera, raycaster, pointer } = useThree();
  const [isGLBLoaded, setIsGLBLoaded] = useState(false);

  const {
    previewMode,
    currentPreviewFurniture,
    previewPosition,
    setPreviewPosition,
    confirmPreview,
    cancelPreview,
  } = useStore();

  // 키보드 이벤트 리스너
  useEffect(() => {
    if (!previewMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        confirmPreview();
      } else if (event.key === "Delete") {
        event.preventDefault();
        cancelPreview();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewMode, confirmPreview, cancelPreview]);

  // 마우스 움직임에 따른 위치 업데이트 (이벤트 기반)
  useEffect(() => {
    if (!previewMode || !currentPreviewFurniture) return;

    const handleMouseMove = (event: MouseEvent) => {
      const canvas = document.querySelector("canvas");
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouse = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
      };

      raycaster.setFromCamera(mouse, camera);

      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);

      if (intersection) {
        setPreviewPosition([intersection.x, 0, intersection.z]);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [
    previewMode,
    currentPreviewFurniture,
    raycaster,
    camera,
    setPreviewPosition,
  ]);

  // 마우스 클릭 이벤트
  useEffect(() => {
    if (!previewMode) return;

    const handleClick = (event: MouseEvent) => {
      // 좌클릭 시 확정
      if (event.button === 0) {
        confirmPreview();
      }
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener("click", handleClick);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [previewMode, confirmPreview]);

  // 가구 크기 계산 - useMemo로 캐싱 (Hooks는 항상 상단에)
  const furnitureSize: [number, number, number] = useMemo(() => {
    if (!currentPreviewFurniture?.length) {
      return [0.001, 0.001, 0.001];
    }
    
    const scale = [1, 1, 1]; // preview에서는 기본 scale 1
    const length = [
      currentPreviewFurniture.length[0],
      currentPreviewFurniture.length[1],
      currentPreviewFurniture.length[2],
    ];

    const MIN_SIZE = 0.001;

    return scale.map((s, i) =>
      Math.max((s || 1) * (length[i] || 1) * 0.001, MIN_SIZE)
    ) as [number, number, number];
  }, [currentPreviewFurniture?.length]);

  // 원형 가이드 크기 계산 - useMemo로 캐싱
  const circleRadius = useMemo(() => 
    Math.max(Math.max(furnitureSize[0], furnitureSize[2]) * 0.8, 0.3)
  , [furnitureSize]);

  const ringInnerRadius = useMemo(() => 
    Math.max(Math.max(furnitureSize[0], furnitureSize[2]) * 0.75, 0.25)
  , [furnitureSize]);

  if (!previewMode || !currentPreviewFurniture) {
    return null;
  }

  return (
    <>
      {/* 바닥 원형 표시 - 위치 가이드 */}
      <mesh
        position={[previewPosition[0], 0.001, previewPosition[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[circleRadius, 32]} />
        <meshBasicMaterial color="#00ff88" side={THREE.DoubleSide} />
      </mesh>

      {/* 바닥 원형 테두리 */}
      <mesh
        position={[previewPosition[0], 0.002, previewPosition[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[ringInnerRadius, circleRadius, 32]} />
        <meshBasicMaterial color="#00ff88" side={THREE.DoubleSide} />
      </mesh>

      {/* URL이 있으면 GLB 모델, 없으면 임시 박스 */}
      {currentPreviewFurniture.url ? (
        <>
          {/* GLB 로딩 중이면 로딩 박스 표시 */}
          {!isGLBLoaded && (
            <group position={previewPosition} scale={furnitureSize}>
              <PreviewBox
                position={[0, 0, 0]}
                size={[1, 1, 1]}
                isLoading={true}
                color="#ff9900"
              />
            </group>
          )}
          <GLBPreview
            url={currentPreviewFurniture.url}
            position={previewPosition}
            scale={furnitureSize}
            onLoadingComplete={() => setIsGLBLoaded(true)}
          />
        </>
      ) : (
        <group position={previewPosition} scale={furnitureSize}>
          <PreviewBox
            position={[0, 0, 0]}
            size={[1, 1, 1]}
            isLoading={true}
            color="#ff9900"
          />
        </group>
      )}
    </>
  );
}
