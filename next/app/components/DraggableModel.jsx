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
  type = "glb", // 'glb' | 'cat'
}) {
  const meshRef = useRef();

  // Zustand 스토어 사용
  const {
    selectedModelId,
    selectModel,
    updateModelPosition,
    updateModelRotation,
    updateModelScale,
  } = useStore();

  const isSelected = selectedModelId === modelId;

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
    controlsRef
  );

  // GLB 모델 로드
  const { scene, animations } = useGLTF(url);
  const texture = texturePath ? useTexture(texturePath) : null;

  // 애니메이션 관련 (고양이용)
  const mixerRef = useRef();
  const actionsRef = useRef({});

  // 모델 설정 (그림자, 클릭 이벤트, 텍스처)
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.userData.modelId = modelId;
          child.userData.clickable = true;

          // City Kit 텍스처 적용
          if (isCityKit && texture) {
            const newMaterial = child.material.clone();
            newMaterial.map = texture;
            newMaterial.needsUpdate = true;
            child.material = newMaterial;
          }
        }
      });

      // 고양이 애니메이션 설정
      if (type === "cat" && animations.length > 0) {
        mixerRef.current = new THREE.AnimationMixer(meshRef.current);

        animations.forEach((clip) => {
          const action = mixerRef.current.clipAction(clip);
          actionsRef.current[clip.name] = action;

          if (
            clip.name.toLowerCase().includes("idle") ||
            Object.keys(actionsRef.current).length === 1
          ) {
            action.play();
          }
        });
      }
    }
  }, [scene, animations, modelId, isCityKit, texture, type]);

  // City Kit 텍스처 재적용 (선택된 경우)
  useFrame((state, delta) => {
    // 애니메이션 업데이트 (고양이용)
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

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
    switch (type) {
      case "cat":
        return [2, 2, 2];
      case "building":
        return [5, 5, 5];
      default:
        return [3, 3, 3];
    }
  };

  return (
    <group>
      {/* 선택 표시 */}
      {isSelected && (
        <mesh position={position}>
          <boxGeometry args={getSelectionBoxSize()} />
          <meshBasicMaterial
            color={type === "cat" ? "#ff6600" : "#00ff00"}
            wireframe
            transparent
            opacity={0.5}
          />
        </mesh>
      )}

      <group
        ref={meshRef}
        position={position}
        rotation={rotation}
        scale={[scale, scale, scale]}
        onPointerDown={handlePointerDown}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <primitive object={scene.clone()} />

        {/* 투명한 히트박스 */}
        <mesh visible={false}>
          <boxGeometry args={getSelectionBoxSize()} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
    </group>
  );
}
