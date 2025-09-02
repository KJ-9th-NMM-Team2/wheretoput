import React, { useRef, useEffect } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useObjectControls } from "../hooks/useObjectControls.js";
import { useStore } from "../store/useStore.js";

export function DraggableModel({
  modelId,
  url,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  controlsRef,
  texturePath = null,
  isCityKit = false,
  type = "glb",
}) {
  // scale 값을 안전하게 처리
  const safeScale = (() => {
    if (Array.isArray(scale)) {
      return scale.map(s => Math.max(s || 1, 0.001));
    } else if (typeof scale === 'number' && scale > 0) {
      return [scale, scale, scale];
    } else {
      return [1, 1, 1];
    }
  })();
  console.log(texturePath, isCityKit);
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
  } = useStore();

  const isSelected = selectedModelId === modelId;
  const isHovering = hoveringModelId === modelId;

  // 객체 조작 훅 사용
  const {
    isDragging,
    isScaling,
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
    controlsRef
  );

  // GLB 모델 로드 (url이 유효하지 않으면 기본값 사용)
  const validUrl =
    url && typeof url === "string" ? url : "/legacy_mesh (1).glb";
  const { scene, animations } = useGLTF(validUrl);
  const texture = texturePath ? useTexture(texturePath) : null;

  // 모델 설정 (그림자, 클릭 이벤트, 텍스처)
  useEffect(() => {
    if (scene && meshRef.current) {
      console.log(`Setting up model ${modelId} with scale:`, safeScale);
      
      meshRef.current.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.userData.modelId = modelId;
          child.userData.clickable = true;
          child.visible = true; // 명시적으로 visible 설정
          
          // 재질이 투명하지 않도록 확인
          if (child.material) {
            if (child.material.transparent === undefined || child.material.opacity === 0) {
              child.material.transparent = false;
              child.material.opacity = 1;
            }
            child.material.needsUpdate = true;
          }

          // City Kit 텍스처 적용
          if (isCityKit && texture) {
            const newMaterial = child.material.clone();
            newMaterial.map = texture;
            newMaterial.transparent = false;
            newMaterial.opacity = 1;
            newMaterial.needsUpdate = true;
            child.material = newMaterial;
          }
        }
      });
      
      // 전체 group도 visible 설정
      meshRef.current.visible = true;
    }
  }, [scene, animations, modelId, isCityKit, texture, type, safeScale]);

  // City Kit 텍스처 재적용 (선택된 경우)
  useFrame((state, delta) => {
    // City Kit 텍스처 재적용
    if (isSelected && meshRef.current && isCityKit && texture) {
      meshRef.current.traverse((child) => {
        if (child.isMesh && child.material && !child.material.map) {
          child.material.map = texture;
          child.material.needsUpdate = true;
        }
      });
    }
  });

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

  // 선택 표시 박스 크기 결정
  const getSelectionBoxSize = () => {
    if (!scene || !meshRef.current) {
      return [1, 1, 1]; // 기본값
    }
    
    try {
      const box = new THREE.Box3().setFromObject(scene);
      if (box.isEmpty()) {
        return [1, 1, 1]; // 빈 박스인 경우 기본값
      }
      
      const boxSize = new THREE.Vector3();
      box.getSize(boxSize);
      
      // 크기가 너무 작거나 0인 경우 기본값 사용
      const x = Math.max(boxSize.x || 1, 0.1);
      const y = Math.max(boxSize.y || 1, 0.1);
      const z = Math.max(boxSize.z || 1, 0.1);
      
      return [x, y, z];
    } catch (error) {
      console.warn('Failed to calculate selection box size:', error);
      return [1, 1, 1];
    }
  };

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
        </group>
      ) : (
        <group
          ref={meshRef}
          position={position}
          rotation={rotation}
          scale={safeScale}
          onPointerDown={handlePointerDown}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <primitive object={scene.clone()} />

          {(isSelected || isHovering) && (
            <mesh
              position={[0, getSelectionBoxSize()[1] / 2, 0]}
            >
              <boxGeometry args={getSelectionBoxSize()} />
              <meshBasicMaterial
                color={isSelected ? "#00ff00" : "#0000ff"}
                wireframe
                transparent
                // depthTest={false}
                opacity={0.5}
              />
            </mesh>
          )}
        </group>
      )}
    </>
  );
}
