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

import React, { useRef, Suspense, useState, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

import { useStore } from '../store/useStore.js'
import { ControlPanel } from '../components/ControlPanel.jsx'
import { InfoPanel } from '../components/InfoPanel.jsx'
import { DraggableModel } from '../components/DraggableModel.jsx'
import { LightControlPanel } from '../components/LightControlPanel.jsx'
import { CameraControlPanel } from '../components/CameraControlPanel.jsx'
import { KeyboardControls } from '../hooks/KeyboardControls.jsx'
import { createWallsFromFloorPlan } from '../../wallDetection.js'
import SimSideView from "@/components/sim/SimSideView"

type position = [number, number, number]

// 동적 바닥 - 벽 데이터에 따라 크기 조정
function Floor({ wallsData }: { wallsData: any[] }) {
  // 벽 데이터가 있으면 벽 영역에 맞게 바닥 크기 계산, 없으면 기본 크기 사용
  let floorSize = 20; // 기본 크기
  
  if (wallsData && wallsData.length > 0) {
    // 모든 벽의 위치에서 최대/최소값을 찾아 바닥 크기 계산
    const positions = wallsData.map(wall => wall.position);
    const xCoords = positions.map(pos => pos[0]);
    const zCoords = positions.map(pos => pos[2]);
    
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minZ = Math.min(...zCoords);
    const maxZ = Math.max(...zCoords);
    
    // 여유공간을 포함하여 바닥 크기 결정
    const rangeX = maxX - minX;
    const rangeZ = maxZ - minZ;
    floorSize = Math.max(rangeX, rangeZ) + 4; // 2m 여유공간 추가
    floorSize = Math.max(floorSize, 10); // 최소 10m 보장
  }
  
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[floorSize, floorSize]} />
      <meshStandardMaterial
        color="#D2B48C"
        roughness={0.9}
        metalness={0.0}
        normalScale={[1, 1]}
      />
    </mesh>
  )
}

// 도면 기반 3D 벽 컴포넌트
function Wall({ width, height, depth = 0.1, position, rotation = [0, 0, 0] }: { 
  width: number; 
  height: number; 
  depth?: number;
  position: position; 
  rotation?: [number, number, number] 
}) {
  // 각 면에 다른 재질 적용
  const materials = [
    new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.8, metalness: 0.1 }), // 오른쪽
    new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.8, metalness: 0.1 }), // 왼쪽
    new THREE.MeshStandardMaterial({ color: '#000000', roughness: 0.8, metalness: 0.1 }), // 윗면 (검은색)
    new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.8, metalness: 0.1 }), // 아랫면
    new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.8, metalness: 0.1 }), // 앞면
    new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.8, metalness: 0.1 })  // 뒷면
  ];

  return (
    <mesh position={position} rotation={rotation} receiveShadow castShadow>
      <boxGeometry args={[width, height, depth]} />
      {materials.map((material, index) => (
        <primitive key={index} object={material} attach={`material-${index}`} />
      ))}
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

export default function SimPage({ params }: { params: Promise<{ id: string }> }) {
  const controlsRef = useRef(null)
  const { 
    loadedModels, 
    deselectModel, 
    ambientLightIntensity, 
    directionalLightPosition, 
    directionalLightIntensity, 
    cameraFov,
    setCurrentRoomId,
    loadSimulatorState,
    isLoading,
    wallsData
  } = useStore()
  const [roomId, setRoomId] = useState(null)

  // URL 파라미터에서 room_id 추출 및 자동 로드
  useEffect(() => {
    const initializeSimulator = async () => {
      try {
        const resolvedParams = await params
        const currentRoomId = resolvedParams.id
        
        console.log(`시뮬레이터 초기화: room_id = ${currentRoomId}`)
        
        setRoomId(currentRoomId)
        setCurrentRoomId(currentRoomId)
        
        // 임시 방이 아닌 경우에만 데이터 로드 시도
        if (!currentRoomId.startsWith('temp_')) {
          try {
            await loadSimulatorState(currentRoomId)
            console.log(`방 ${currentRoomId}의 데이터 로드 완료`)
          } catch (loadError) {
            console.log(`방 ${currentRoomId}의 저장된 데이터 없음:`, loadError.message)
            // 저장된 데이터가 없어도 에러로 처리하지 않음
          }
        } else {
          console.log(`임시 방 ${currentRoomId}이므로 데이터 로드를 건너뜁니다.`)
        }
        
      } catch (error) {
        console.error('시뮬레이터 초기화 실패:', error)
      }
    }

    initializeSimulator()
  }, [params, setCurrentRoomId, loadSimulatorState])

  // 벽 데이터는 이제 loadSimulatorState에서 함께 로드됨

  // const camera = new THREE.PerspectiveCamera(cameraFov, 2, 0.1, 1000)
  // camera.position.set(10, 6, 10)

  return (
    <div className="flex h-screen overflow-hidden">
      <SimSideView />

      <div className="flex-1 relative">
        {/* 로딩 상태 표시 */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            zIndex: 1000,
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '10px' }}>🏠</div>
            <div>방 데이터 로딩 중...</div>
            <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.7 }}>
              Room ID: {roomId}
            </div>
          </div>
        )}
        
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

          {/* {cameraMode == "perspective" ? (
            <PerspectiveCamera makeDefault fov={cameraFov} position={[-20, 15, 0]} />
          ) : (
            <OrthographicCamera makeDefault position={[-20, 15, 0]} zoom={50} />
          )} */}
          
        <CameraUpdater />
        
        <color attach="background" args={['#87CEEB']} />

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

        <Floor wallsData={wallsData} />
        
        {/* 도면 기반 벽들 또는 기본 벽들 */}
        {wallsData.length > 0 ? (
          // 도면 데이터 기반 벽들
          wallsData.map((wall) => (
            <Wall
              key={wall.id}
              width={wall.dimensions.width}
              height={wall.dimensions.height}
              depth={wall.dimensions.depth}
              position={wall.position}
              rotation={wall.rotation}
            />
          ))
        ) : (
          // 기본 벽들 (도면 데이터가 없을 때)
          <>
            <Wall width={20} height={5} position={[0, 2.5, -10]} rotation={[0, 0, 0]} />
            <Wall width={20} height={5} position={[-10, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} />
            <Wall width={20} height={5} position={[10, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} />
            <Wall width={20} height={5} position={[0, 2.5, 10]} rotation={[0, Math.PI, 0]} />
          </>
        )}

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

        <KeyboardControls 
          controlsRef={controlsRef}
        />
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