'use client'
// 시뮬레이터 페이지 - 수연, 성진
// app\sim\[id]\page.tsx 에 있어야 합니다.
// export default async function SimPage({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const { id } = await params;  // /pages/[id]에 해당하는 id 값
//   return <h1>시뮬레이터 페이지 - id {id}</h1>;
// }
import React, { useRef, Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

import { useStore } from '../store/useStore.js'
import { ControlPanel } from '../components/ControlPanel.jsx'
import { InfoPanel } from '../components/InfoPanel.jsx'
import { DraggableModel } from '../components/DraggableModel.jsx'
import { LightControlPanel } from '../components/LightControlPanel.jsx'
import { CameraControlPanel } from '../components/CameraControlPanel.jsx'
import SimSideView from "@/components/sim/SimSideView"

type position = [number, number, number]

// [임시] 바닥 - BFC 적용중인 planeGeometry
// 구현 필요 : 도면 변환 후 벽 내부에만 바닥이 존재하게 하기, 텍스쳐 적용
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

// [임시] 벽 - BFC 적용중인 planeGeometry
// 구현 필요 : 두께가 있는 벽, 텍스쳐 적용
function Wall({ width, height, position, rotation = 0 }: { width: number; height: number; position: position; rotation?: number }) {
  return (
    <mesh position={position} rotation={[0, rotation, 0]} receiveShadow castShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        color="#F0F0F0"
        roughness={0.8}
        metalness={0.1}
        // side={THREE.DoubleSide}
        normalScale={[0.5, 0.5]}
      />
    </mesh>
  )
}

function CameraUpdater() {
  const fov = useStore((state) => state.cameraFov);
  const { camera } = useThree();
  const perspectiveCamera = camera as THREE.PerspectiveCamera;

  useEffect(() => {
    perspectiveCamera.fov = fov;
    perspectiveCamera.updateProjectionMatrix();
  }, [fov, perspectiveCamera]);

  return null;
}

export default function SimPage() {
  const controlsRef = useRef(null)
  const { loadedModels, deselectModel, ambientLightIntensity, directionalLightPosition, directionalLightIntensity } = useStore()

  return (
    <div className="flex h-screen overflow-hidden">
      <SimSideView />

      <div className="flex-1 relative">
        <ControlPanel />
        <InfoPanel />
        <LightControlPanel />
        <CameraControlPanel />

        <Canvas
          camera={{ position: [-20, 15, 0], fov: 60 }}
          shadows
          style={{ width: '100%', height: '100vh' }}
          frameloop='demand'
        >
          <color attach="background" args={['#87CEEB']} />
          <CameraUpdater />

          <ambientLight intensity={ambientLightIntensity} />
          <directionalLight
            position={directionalLightPosition}
            intensity={directionalLightIntensity}
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

          <Floor />
        // Walls
          {
            <>
              <Wall width={20} height={5} position={[0, 2.5, -10]} rotation={0} />
              <Wall width={20} height={5} position={[-10, 2.5, 0]} rotation={Math.PI / 2} />
              <Wall width={20} height={5} position={[10, 2.5, 0]} rotation={-Math.PI / 2} />
              <Wall width={20} height={5} position={[0, 2.5, 10]} rotation={Math.PI} />
            </>
          }

          <Suspense fallback={null}>
            {loadedModels.map((model: any) => (
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
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={20}
          />
        </Canvas>
      </div>
    </div>
  )
}