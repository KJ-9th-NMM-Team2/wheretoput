"use client";

import React, { useRef, Suspense, useState, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { useStore } from "@/components/sim/useStore.js";
import { Wall } from "@/components/sim/mainsim/Wall.jsx";
import { MergedWalls } from "@/components/sim/mainsim/MergedWalls.jsx";
import { WallPreview } from "@/components/sim/mainsim/WallPreview.jsx";
import { WallSnapPoints } from "@/components/sim/mainsim/WallSnapPoints.jsx";
import { DraggableModel } from "@/components/sim/mainsim/DraggableModel.jsx";
import { ControlIcons } from "@/components/sim/mainsim/ControlIcons.jsx";
import { SelectedModelEditModal } from "@/components/sim/mainsim/SelectedModelSidebar.jsx";
import { KeyboardControls } from "@/components/sim/mainsim/KeyboardControls.jsx";
import { autoSnapToNearestWallEndpoint } from "@/components/sim/wall/wallUtils.js";
import SimSideView from "@/components/sim/SimSideView";
import CanvasImageLogger from "@/components/sim/CanvasCapture";
import AutoSave from "@/components/sim/AutoSave";
import AutoSaveIndicator from "@/components/sim/AutoSaveIndicator";
import { Environment } from "@react-three/drei";
import { useSession } from "next-auth/react";
import { ArchievementToast } from "./achievement/ArchievementToast";
import { MobileHeader } from "./mobile/MobileHeader";
import WallTools from "./side/WallTools";

type position = [number, number, number];

// 동적 바닥 - 벽 데이터에 따라 내부 영역에만 바닥 렌더링
function Floor({ wallsData }: { wallsData: any[] }) {
  const { floorColor } = useStore();

  // 벽 데이터가 없으면 기본 바닥 렌더링
  if (!wallsData || wallsData.length === 0) {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          color={floorColor}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>
    );
  }

  // 벽들의 2D 좌표를 추출하여 내부 영역 계산
  const wallLines = wallsData.map((wall) => {
    const { position, rotation, dimensions } = wall;
    const length = dimensions.width;
    const angle = rotation[1]; // Y축 회전각

    // 벽의 시작점과 끝점 계산
    const halfLength = length / 2;
    const startX = position[0] - Math.cos(angle) * halfLength;
    const startZ = position[2] - Math.sin(angle) * halfLength;
    const endX = position[0] + Math.cos(angle) * halfLength;
    const endZ = position[2] + Math.sin(angle) * halfLength;

    return { startX, startZ, endX, endZ };
  });

  // 경계 상자 계산
  const allX = [
    ...wallLines.map((w) => w.startX),
    ...wallLines.map((w) => w.endX),
  ];
  const allZ = [
    ...wallLines.map((w) => w.startZ),
    ...wallLines.map((w) => w.endZ),
  ];
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minZ = Math.min(...allZ);
  const maxZ = Math.max(...allZ);

  // 내부 영역 크기 계산 (벽 두께 고려하여 약간 작게)
  const width = maxX - minX - 0.2; // 벽 두께만큼 빼기
  const height = maxZ - minZ - 0.2;
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  return (
    <mesh
      position={[centerX, -0.01, centerZ]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        color={floorColor}
        roughness={0.9}
        metalness={0.0}
      />
    </mesh>
  );
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

// SimulatorCore Props 타입 정의
interface SimulatorCoreProps {
  roomId: string;
  // 모드별 설정
  showSidebar?: boolean;
  showModeControls?: boolean;
  showEditControls?: boolean;
  // 커스텀 헤더 컴포넌트
  customHeader?: React.ReactNode;
  // Canvas 내부 추가 요소들 (협업 모드에서 사용)
  canvasChildren?: React.ReactNode;
  // 추가 UI 요소들
  additionalUI?: React.ReactNode;
  // 로딩 메시지 커스터마이징
  loadingMessage?: string;
  loadingIcon?: string;
  // 키보드 컨트롤 비활성화 옵션
  keyboardControlsDisabled?: boolean;
  // 모바일 모드 여부
  isMobile?: boolean;
  // 1. normal, 2. collaboration, 3. mobile
  accessType: number;
}

/**
 * 시뮬레이터의 핵심 렌더링 로직을 담당하는 공통 컴포넌트
 *
 * 다양한 모드(보기/편집/협업)에서 재사용 가능하도록 설계됨
 */
export function SimulatorCore({
  roomId,
  showSidebar = true,
  showModeControls = true,
  showEditControls = true,
  customHeader,
  canvasChildren,
  additionalUI,
  loadingMessage = "방 데이터 로딩 중...",
  loadingIcon = "🏠",
  keyboardControlsDisabled = false,
  isMobile = false,
  accessType = 1
}: SimulatorCoreProps) {
  const controlsRef = useRef(null);
  const { data: session } = useSession();
  const {
    viewOnly,
    backgroundColor,
    environmentPreset,
    loadedModels,
    deselectModel,
    directionalLightPosition,
    directionalLightIntensity,
    setCurrentRoomId,
    loadSimulatorState,
    isLoading,
    wallsData,
    addModel,
    addModelWithId,
    removeModel,
    collaborationMode,
    checkUserRoom,
    currentRoomInfo,
    wallToolMode,
    wallDrawingStart,
    setWallDrawingStart,
    addWall,
    removeWall,
    setSelectedWallId,
    isChatFocused,
  } = useStore();

  const [startTime, setStartTime] = useState<number | null>(null);

  // 상태 기반 속도 측정
  useEffect(() => {
    if (!loadedModels.legnth && !startTime) {
      setStartTime(performance.now());
    }
  }, []);

  // Suspense fallback이 완전히 사라진 후
  useEffect(() => {
    if (startTime && loadedModels.length > 0) {
      const endTime = performance.now();
      console.log(`All models loaded in: ${endTime - startTime}ms`);
    }
  }, [loadedModels]);

  // URL 파라미터 초기화 및 데이터 로드
  useEffect(() => {
    const initializeSimulator = async () => {
      try {
        setCurrentRoomId(roomId);

        // 임시 방이 아닌 경우에만 데이터 로드 시도
        if (!roomId.startsWith("temp_")) {
          try {
            if (collaborationMode) {
              console.log(
                `협업 모드이므로 벽 데이터만 로드하고 가구는 Redis에서 받습니다.`
              );
              await loadSimulatorState(roomId, { wallsOnly: true });
            } else {
              await loadSimulatorState(roomId);
            }

            // 방 소유권 확인 (자동저장을 위해 필요)

            if (session?.user?.id) {
              await checkUserRoom(roomId, session.user.id);
            } else {
            }
          } catch (loadError) {
            console.log(
              `방 ${roomId}의 저장된 데이터 없음:`,
              loadError.message
            );
          }
        } else {
          console.log(`임시 방 ${roomId}이므로 데이터 로드를 건너뜁니다.`);
        }
      } catch (error) {
        console.error("시뮬레이터 초기화 실패:", error);
      }
    };

    if (roomId) {
      initializeSimulator();
    }
  }, [
    roomId,
    setCurrentRoomId,
    loadSimulatorState,
    collaborationMode,
    session?.user?.id,
    checkUserRoom,
  ]);

  // 히스토리 시스템에서 오는 가구 추가/삭제 이벤트 처리
  useEffect(() => {
    const handleHistoryAddFurniture = (event) => {
      const { furnitureData } = event.detail;

      const modelToAdd = {
        ...furnitureData,
        id: furnitureData.id,
      };

      addModelWithId(modelToAdd);
    };

    const handleHistoryRemoveFurniture = (event) => {
      const { furnitureId } = event.detail;
      removeModel(furnitureId);
    };

    window.addEventListener("historyAddFurniture", handleHistoryAddFurniture);
    window.addEventListener(
      "historyRemoveFurniture",
      handleHistoryRemoveFurniture
    );

    return () => {
      window.removeEventListener(
        "historyAddFurniture",
        handleHistoryAddFurniture
      );
      window.removeEventListener(
        "historyRemoveFurniture",
        handleHistoryRemoveFurniture
      );
    };
  }, [addModelWithId, removeModel]);

  return (
    <div
      className={`flex h-screen overflow-hidden ${
        isMobile ? "bg-gray-50" : ""
      }`}
    >
      {/* 조건부 사이드바 표시 */}
      {showSidebar && !viewOnly && <SimSideView roomId={roomId} accessType={accessType} />}

      <div className="flex-1 relative">
        {/* 모바일 헤더 */}
        {isMobile && (
          <MobileHeader roomInfo={currentRoomInfo} controlsRef={controlsRef} />
        )}
        {/* 로딩 상태 표시 */}
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(0,0,0,0.8)",
              color: "white",
              padding: "20px",
              borderRadius: "10px",
              zIndex: 1000,
              textAlign: "center",
            }}
          >
            <div style={{ marginBottom: "10px" }}>{loadingIcon}</div>
            <div>{loadingMessage}</div>
            <div style={{ fontSize: "12px", marginTop: "5px", opacity: 0.7 }}>
              Room ID: {roomId}
            </div>
          </div>
        )}

        {/* 커스텀 헤더 또는 기본 모드 컨트롤 */}
        {customHeader}

        {/* 조건 달성 토스트 팝업 - 모드 컨트롤 아래 중앙 */}
        <ArchievementToast />

        {/* 추가 UI 요소들 */}
        {additionalUI}

        {/* [09.06] 자동저장  - 편집 모드일 때만 활성화 */}
        {!viewOnly && <AutoSave enabled={!viewOnly} />}

        {/* [09.06] 자동저장 상태 표시 */}
        {/* 팝업 알림은 ControIcons 아래에 위치 */}
        {!viewOnly && <AutoSaveIndicator position="top-right" />}

        {/* 편집 컨트롤 아이콘 */}
        {showEditControls && !viewOnly && (
          <ControlIcons controlsRef={controlsRef} />
        )}

        {/* 벽 도구 드롭다운 */}
        {!viewOnly && <WallTools isDropdown={true} />}

        <SelectedModelEditModal />

        <Canvas
          camera={{ position: [0, 20, 30], fov: 60 }}
          shadows
          style={{
            width: "100%",
            height: "100vh",
            marginTop: isMobile ? "60px" : "0", // 모바일 헤더 높이만큼 여백
          }}
          frameloop="demand"
        >
          <Environment preset={environmentPreset} background={false} />

          <CameraUpdater />
          <color attach="background" args={[backgroundColor]} />
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

          {/* 벽 렌더링 - 자동 병합 적용 */}
          {wallsData.length > 0 ? (
            <MergedWalls wallsData={wallsData} />
          ) : (
            <>
              <Wall
                width={20}
                height={5}
                position={[0, 2.5, -10]}
                rotation={[0, 0, 0]}
              />
              <Wall
                width={20}
                height={5}
                position={[-10, 2.5, 0]}
                rotation={[0, Math.PI / 2, 0]}
              />
              <Wall
                width={20}
                height={5}
                position={[10, 2.5, 0]}
                rotation={[0, -Math.PI / 2, 0]}
              />
              <Wall
                width={20}
                height={5}
                position={[0, 2.5, 10]}
                rotation={[0, Math.PI, 0]}
              />
            </>
          )}

          <Suspense fallback={null}>
            {loadedModels.map((model: any) => {
              return (
                <DraggableModel
                  key={model.id}
                  modelId={model.id}
                  url={model.url}
                  position={model.position}
                  rotation={model.rotation}
                  scale={model.scale}
                  length={model.length}
                  controlsRef={controlsRef}
                  isCityKit={model.isCityKit}
                  texturePath={model.texturePath}
                  type={model.isCityKit ? "building" : "glb"}
                />
              );
            })}
          </Suspense>

          <mesh
            position={[0, -0.01, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerDown={(event) => {
              // 벽 추가 모드에서의 바닥 클릭 처리
              if (wallToolMode === 'add') {
                event.stopPropagation();
                const point = event.point;
                const clickPoint = [point.x, 0, point.z];
                
                // 스냅 포인트 근처인지 확인하고 자동으로 스냅
                const snappedPoint = autoSnapToNearestWallEndpoint(clickPoint, wallsData, 1.0);
                
                if (!wallDrawingStart) {
                  // 시작점 설정
                  setWallDrawingStart(snappedPoint);
                } else {
                  // 직선 벽을 위한 좌표 정렬
                  let alignedEndPoint = snappedPoint;
                  
                  // 시작점과 끝점이 다를 때만 정렬 처리
                  if (wallDrawingStart[0] !== snappedPoint[0] || wallDrawingStart[2] !== snappedPoint[2]) {
                    const deltaX = Math.abs(snappedPoint[0] - wallDrawingStart[0]);
                    const deltaZ = Math.abs(snappedPoint[2] - wallDrawingStart[2]);
                    
                    // 더 긴 축을 기준으로 직선 벽 생성
                    if (deltaX > deltaZ) {
                      // X축 방향 벽 (Z좌표를 시작점과 동일하게)
                      alignedEndPoint = [snappedPoint[0], 0, wallDrawingStart[2]];
                    } else {
                      // Z축 방향 벽 (X좌표를 시작점과 동일하게)
                      alignedEndPoint = [wallDrawingStart[0], 0, snappedPoint[2]];
                    }
                  }
                  
                  // 끝점으로 벽 생성
                  addWall(wallDrawingStart, alignedEndPoint);
                  // 벽 생성 완료 후 시작점 초기화 (연속 그리기 비활성화)
                  // setWallDrawingStart(alignedEndPoint); // 이 줄을 제거하여 연속 그리기 방지
                }
              } else {
                // 기본 동작 (모델 선택 해제)
                deselectModel();
              }
            }}
          >
            <planeGeometry args={[200, 200]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>

          <KeyboardControls
            controlsRef={controlsRef}
            disabled={keyboardControlsDisabled || isChatFocused}
          />
          <OrbitControls
            ref={controlsRef}
            enableZoom={true}
            enableRotate={true}
            enablePan={true}
            enableDamping={isMobile ? true : false}
            dampingFactor={isMobile ? 0.05 : undefined}
            rotateSpeed={isMobile ? 0.8 : 0.3}
            panSpeed={isMobile ? 1.0 : 0.5}
            zoomSpeed={isMobile ? 0.8 : undefined}
            minDistance={isMobile ? 1 : 8}
            maxDistance={50}
            maxPolarAngle={isMobile ? Math.PI * 0.95 : undefined}
            minPolarAngle={isMobile ? Math.PI * 0.05 : undefined}
            touches={
              isMobile
                ? {
                    ONE: 0, // 한 손가락으로 회전
                    TWO: 2, // 두 손가락으로 확대축소, 이동
                  }
                : undefined
            }
          />

          {/* 벽 그리기 프리뷰 */}
          <WallPreview />

          {/* 벽 스냅 포인트 */}
          <WallSnapPoints />

          {/* Canvas 내부 추가 요소들 (협업 모드 커서 등) */}
          {canvasChildren}

          <CanvasImageLogger />
        </Canvas>
      </div>
    </div>
  );
}
