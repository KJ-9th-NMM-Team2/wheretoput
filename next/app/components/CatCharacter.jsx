import React, { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore.js'

export function CatCharacter() {
  const catRef = useRef()
  const { selectedModelId, selectModel } = useStore()
  const isSelected = selectedModelId === 'cat'
  
  // 고양이 GLB 모델 로드
  const { scene } = useGLTF('/asset/cat.glb')
  
  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isSelected || !catRef.current) return
      
      const moveSpeed = 0.1
      const position = catRef.current.position
      
      switch(e.key.toLowerCase()) {
        case 'w':
          position.z -= moveSpeed
          break
        case 's':
          position.z += moveSpeed
          break
        case 'a':
          position.x -= moveSpeed
          break
        case 'd':
          position.x += moveSpeed
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isSelected])
  
  const handleClick = (e) => {
    e.stopPropagation()
    selectModel('cat')
  }
  
  return (
    <group
      ref={catRef}
      position={[0, 0, 2]}
      scale={0.5}
      onClick={handleClick}
    >
      <primitive 
        object={scene.clone()} 
        castShadow 
        receiveShadow
      />
      {isSelected && (
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshBasicMaterial 
            color="yellow" 
            transparent 
            opacity={0.2} 
            wireframe 
          />
        </mesh>
      )}
    </group>
  )
}