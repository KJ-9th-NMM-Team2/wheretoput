import React, { useRef, useEffect, useState } from "react";
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
}: {
  url: string;
  position: [number, number, number];
  scale: [number, number, number];
  onLoad?: () => void;
}) {
  const { scene } = useGLTF(url);
  const meshRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (scene && meshRef.current) {
      // 바닥에 맞춤
      const box = new THREE.Box3().setFromObject(scene);
      const min = box.min;
      const yOffset = -min.y * scale[1];

      meshRef.current.position.set(
        position[0],
        position[1] + yOffset,
        position[2]
      );
      meshRef.current.scale.set(...scale);

      // 투명도 적용
      scene.traverse((child) => {
        if ((child as any).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material = mesh.material.map((mat) => {
                const clonedMat = mat.clone();
                clonedMat.transparent = true;
                clonedMat.opacity = 0.7;
                return clonedMat;
              });
            } else {
              mesh.material = mesh.material.clone();
              mesh.material.transparent = true;
              mesh.material.opacity = 0.7;
            }
          }
        }
      });
    }
  }, [scene, position, scale]);

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
      } else if (event.key === "Escape") {
        event.preventDefault();
        cancelPreview();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewMode, confirmPreview, cancelPreview]);

  // 마우스 움직임에 따른 위치 업데이트
  useFrame(() => {
    if (!previewMode || !currentPreviewFurniture) return;

    // 마우스 위치를 3D 월드 좌표로 변환
    raycaster.setFromCamera(pointer, camera);

    // y=0 평면과의 교차점 계산
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    if (intersection) {
      setPreviewPosition([intersection.x, 0, intersection.z]);
    }
  });

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

  if (!previewMode || !currentPreviewFurniture) {
    return null;
  }

  // 가구 크기 계산
  const furnitureSize: [number, number, number] = [
    (currentPreviewFurniture.length_x || 1) * 0.001,
    (currentPreviewFurniture.length_y || 1) * 0.001,
    (currentPreviewFurniture.length_z || 1) * 0.001,
  ];

  return (
    <>
      {/* URL이 있으면 GLB 모델, 없으면 임시 박스 */}
      {currentPreviewFurniture.url ? (
        <GLBPreview
          url={currentPreviewFurniture.url}
          position={previewPosition}
          scale={furnitureSize.map((s) => s / 0.001) as [number, number, number]} // 원래 스케일로 복원
        />
      ) : (
        <PreviewBox
          position={previewPosition}
          size={furnitureSize}
          isLoading={true}
        />
      )}
    </>
  );
}
