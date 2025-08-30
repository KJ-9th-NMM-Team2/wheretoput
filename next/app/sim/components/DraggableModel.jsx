import React, { useRef, useEffect } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useObjectControls } from '../hooks/useObjectControls.js'
import { useStore } from '../store/useStore.js'

export function DraggableModel({
  modelId,
  url,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  controlsRef,
  texturePath = null,
  isCityKit = false,
  type = 'glb'
}) {
  const meshRef = useRef()

  // Zustand 스토어 사용
  const {
    selectedModelId,
    hoveringModelId,
    selectModel,
    hoveringModel,
    updateModelPosition,
    updateModelRotation,
    updateModelScale
  } = useStore()

  const isSelected = selectedModelId === modelId
  const isHovering = hoveringModelId === modelId

  // 객체 조작 훅 사용
  const {
    isDragging,
    isScaling,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerOver,
    handlePointerOut
  } = useObjectControls(
    modelId,
    updateModelPosition,
    updateModelRotation,
    updateModelScale,
    selectModel,
    hoveringModel,
    controlsRef,
    position
  )

  // GLB 모델 로드
  const { scene, animations } = useGLTF(url)
  const texture = texturePath ? useTexture(texturePath) : null

  // 모델 설정 (그림자, 클릭 이벤트, 텍스처)
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          child.userData.modelId = modelId
          child.userData.clickable = true

          // City Kit 텍스처 적용
          if (isCityKit && texture) {
            const newMaterial = child.material.clone()
            newMaterial.map = texture
            newMaterial.needsUpdate = true
            child.material = newMaterial
          }
        }
      })
    }
  }, [scene, animations, modelId, isCityKit, texture, type])

  // City Kit 텍스처 재적용 (선택된 경우)
  useFrame((state, delta) => {
    // City Kit 텍스처 재적용
    if (isSelected && meshRef.current && isCityKit && texture) {
      meshRef.current.traverse((child) => {
        if (child.isMesh && child.material && !child.material.map) {
          child.material.map = texture
          child.material.needsUpdate = true
        }
      })
    }
  })

  // 전역 이벤트 리스너
  useEffect(() => {
    if (isDragging || isScaling) {
      const handleMouseMove = (e) => handlePointerMove(e)
      const handleMouseUp = () => handlePointerUp()

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isScaling, handlePointerMove, handlePointerUp])

  // 선택 표시 박스 크기 결정
  const getSelectionBoxSize = () => {
    const box = new THREE.Box3().setFromObject(scene);
    const boxSize = new THREE.Vector3();
    box.getSize(boxSize);

    return [boxSize.x, boxSize.y, boxSize.z];
  }

  return (
    <>
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

        {(isSelected || isHovering) && (
          <mesh>
            <boxGeometry args={getSelectionBoxSize()} />
            <meshBasicMaterial
              color={isSelected ? "#00ff00" : "#0000ff"}
              wireframe
              transparent
              opacity={0.5}
            />
          </mesh>
        )}

        {/* 투명한 히트박스 */}
        {/* 이 컴포넌트가 클릭 선택 관련 이슈를 일으켜서 주석 처리합니다 */}
        {/* <mesh visible={false}>
          <boxGeometry args={getSelectionBoxSize()} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh> */}
      </group>
    </>
  )
}