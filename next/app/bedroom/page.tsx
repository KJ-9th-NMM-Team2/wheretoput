'use client'

import React, { useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

import { useStore } from '../store/useStore.js'
import { ControlPanel } from '../components/ControlPanel.jsx'
import { InfoPanel } from '../components/InfoPanel.jsx'
import { DraggableModel } from '../components/DraggableModel.jsx'


function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial 
        color="#D2B48C"
        roughness={0.9}
        metalness={0.0}
        normalScale={[1, 1]}
      />
    </mesh>
  )
}

function Wall({ width, height, position, rotation = 0 }: { width: number; height: number; position: [number, number, number]; rotation?: number }) {
  return (
    <mesh position={position} rotation={[0, rotation, 0]} receiveShadow castShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial 
        color="#F0F0F0"
        roughness={0.8}
        metalness={0.1}
        side={THREE.DoubleSide}
        normalScale={[0.5, 0.5]}
      />
    </mesh>
  )
}

function Bed({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.5, 4]} />
        <meshLambertMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[2.8, 0.3, 3.8]} />
        <meshLambertMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0, 0.9, -1.3]} castShadow>
        <boxGeometry args={[1.5, 0.2, 0.8]} />
        <meshLambertMaterial color="#FFE4E1" />
      </mesh>
      <mesh position={[0, 1, -2]} castShadow>
        <boxGeometry args={[3, 1.5, 0.2]} />
        <meshLambertMaterial color="#654321" />
      </mesh>
    </group>
  )
}

function Desk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.1, 1]} />
        <meshLambertMaterial color="#8B6914" />
      </mesh>
      {[[-0.9, -0.4], [0.9, -0.4], [-0.9, 0.4], [0.9, 0.4]].map(([x, z], index) => (
        <mesh key={index} position={[x, 0.5, z]} castShadow>
          <boxGeometry args={[0.1, 1, 0.1]} />
          <meshLambertMaterial color="#654321" />
        </mesh>
      ))}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.5, 0.3, 0.8]} />
        <meshLambertMaterial color="#8B6914" />
      </mesh>
    </group>
  )
}

function Chair({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.8, 0.1, 0.8]} />
        <meshLambertMaterial color="#4682B4" />
      </mesh>
      <mesh position={[0, 0.9, -0.35]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.1]} />
        <meshLambertMaterial color="#4682B4" />
      </mesh>
      {[[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].map(([x, z], index) => (
        <mesh key={index} position={[x, 0.25, z]} castShadow>
          <boxGeometry args={[0.08, 0.5, 0.08]} />
          <meshLambertMaterial color="#333333" />
        </mesh>
      ))}
    </group>
  )
}

function Window({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[2, 2, 0.1]} />
        <meshLambertMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, 0, 0.051]}>
        <planeGeometry args={[1.8, 1.8]} />
        <meshPhysicalMaterial 
          color="#88CCFF" 
          transparent 
          opacity={0.3} 
          roughness={0.1} 
          metalness={0.1} 
        />
      </mesh>
      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[0.05, 1.8, 0.05]} />
        <meshLambertMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[1.8, 0.05, 0.05]} />
        <meshLambertMaterial color="#8B4513" />
      </mesh>
    </group>
  )
}

function Nightstand({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.8, 0.05, 0.8]} />
        <meshLambertMaterial color="#8B6914" />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.7, 0.5, 0.7]} />
        <meshLambertMaterial color="#8B6914" />
      </mesh>
    </group>
  )
}

function Lamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.15, 0.15, 0.05, 16]} />
        <meshLambertMaterial color="#333333" />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        <meshLambertMaterial color="#333333" />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.1, 0.2, 0.2, 16]} />
        <meshLambertMaterial color="#FFFFAA" />
      </mesh>
      <pointLight 
        position={[0, 0.3, 0]} 
        color="#FFFF88" 
        intensity={0.3} 
        distance={5}
        castShadow 
      />
    </group>
  )
}

function Rug({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[3, 2]} />
      <meshLambertMaterial color="#8B0000" side={THREE.DoubleSide} />
    </mesh>
  )
}

export default function BedroomPage() {
  const controlsRef = useRef()
  const { detectedWalls, loadedModels, deselectModel } = useStore()

  return (
    <>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 100,
        fontSize: '12px'
      }}>
        <div>🏠 3D 인테리어 시뮬레이터</div>
        <div>🖱️ 마우스: 회전/줌 | 우클릭: 이동</div>
        <div>🎯 모델 클릭: 선택 | Shift+드래그: 크기 조정</div>
        <div>🐱 고양이 선택 후 WASD: 키보드 이동</div>
      </div>
      
      <ControlPanel />
      <InfoPanel />

      <Canvas
        camera={{ position: [8, 6, 8], fov: 75 }}
        shadows
        style={{ width: '100vw', height: '100vh' }}
        frameloop='demand'
      >
        <color attach="background" args={['#87CEEB']} />
        
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={0.8}
          castShadow
          shadow-camera-near={0.1}
          shadow-camera-far={50}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-8, 4, -8]} intensity={0.5} color="#FFE4B5" />
        <pointLight position={[8, 4, 8]} intensity={0.4} color="#E6E6FA" />
        <spotLight
          position={[0, 8, 0]}
          angle={0.3}
          penumbra={0.3}
          intensity={0.3}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        <Floor />
        {detectedWalls.length > 0 ? (
          detectedWalls.map((wall) => (
            <Wall
              key={wall.id}
              width={wall.width}
              height={wall.height}
              position={wall.position}
              rotation={wall.rotation[1]}
            />
          ))
        ) : (
          <>
            <Wall width={20} height={5} position={[0, 2.5, -10]} rotation={0} />
            <Wall width={20} height={5} position={[-10, 2.5, 0]} rotation={Math.PI / 2} />
            <Wall width={20} height={5} position={[10, 2.5, 0]} rotation={-Math.PI / 2} />
            <Wall width={20} height={5} position={[0, 2.5, 10]} rotation={Math.PI} />
          </>
        )}
        
        <Bed position={[-2, 0, -2]} />
        <Desk position={[3, 0, -3]} />
        <Chair position={[3, 0, -1.5]} rotation={Math.PI} />
        <Window position={[0, 2.5, -9.95]} />
        <Nightstand position={[-4, 0, -2]} />
        <Lamp position={[-4, 0.65, -2]} />
        <Rug position={[1, 0.01, 0]} />
        
    


        <Suspense fallback={null}>
          {loadedModels.map(model => (
            <DraggableModel
              key={model.id}
              modelId={model.id}
              url={model.url}
              position={model.position}
              rotation={model.rotation}
              scale={model.scale}
              controlsRef={controlsRef}
              isCityKit={model.isCityKit}
              texturePath={model.texturePath}
              type={model.isCityKit ? "building" : "glb"}
            />
          ))}
        </Suspense>
        
        <mesh 
          position={[0, -0.01, 0]} 
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerDown={deselectModel}
        >
          <planeGeometry args={[200, 200]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        
        <OrbitControls
          ref={controlsRef}
          target={[0, 1, 0]}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={20}
        />
      </Canvas>
    </>
  )
}