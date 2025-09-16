"use client";

import React, {
  useRef,
  Suspense,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { OrbitControls, useTexture, Environment } from "@react-three/drei";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  fetchRoomInfo,
  updateRoomInfo,
  deleteRoom,
  type RoomInfo,
} from "@/lib/services/roomService";

// Store and utilities
import { useStore } from "@/components/sim/useStore.js";
// Main simulation components
import { Wall } from "@/components/sim/mainsim/wall/Wall.jsx";
import { MergedWalls } from "@/components/sim/mainsim/wall/MergedWalls.jsx";
import { WallPreview } from "@/components/sim/mainsim/wall/WallPreview.jsx";
import { WallSnapPoints } from "@/components/sim/mainsim/wall/WallSnapPoints.jsx";
import { DraggableModel } from "@/components/sim/mainsim/DraggableModel.jsx";
import { ControlIcons } from "@/components/sim/mainsim/control/ControlIcons.jsx";
import { SelectedModelEditModal } from "@/components/sim/mainsim/SelectedModelSidebar.jsx";

import { KeyboardControls } from "@/components/sim/mainsim/control/KeyboardControls.jsx";
import { autoSnapToNearestWallEndpoint } from "@/components/sim/wall/wallUtils.js";
import {
  determineValueType,
  generateSaveValues,
  parseLoadedValues,
} from "@/lib/textureUtils.js";
import { 
  calculateWallsCenter, 
  calculateOptimalCameraPosition, 
  getCameraTarget 
} from "@/utils/cameraUtils";

// import { Environment } from "@react-three/drei";
import { CaptureModal } from "@/components/sim/mainsim/CaptureModal";
import { CaptureHandler } from "@/components/sim/mainsim/CaptureHandler";

// UI and feature components
import SimSideView from "@/components/sim/SimSideView";
import WallTools from "./side/WallTools";
import EditPopup from "./side/EditPopup";
import { ArchievementToast } from "./achievement/ArchievementToast";
import { MobileHeader } from "./mobile/MobileHeader";
import { PreviewManager } from "./preview/PreviewManager";
import { WallMeasurements } from "./measurements/WallMeasurements";
import { ObjectMeasurements } from "./measurements/ObjectMeasurements";

// System components
import CanvasImageLogger from "@/components/sim/CanvasCapture";
import AutoSave from "@/components/sim/save/AutoSave";
import AutoSaveIndicator from "@/components/sim/save/AutoSaveIndicator";

type position = [number, number, number];

// 바닥 재질 컴포넌트 (textureUtils 사용)
function FloorMaterial() {
  const { floorColor, floorTexture, floorTexturePresets } = useStore();

  // textureUtils로 현재 값 타입 확인
  const { saveValues } = React.useMemo(() => {
    const envState = {
      floorTexture,
      floorColor,
      floorTexturePresets,
      wallTexture: "color",
      wallColor: "#FFFFFF",
      wallTexturePresets: {},
    };
    return {
      saveValues: generateSaveValues(envState),
    };
  }, [floorTexture, floorColor, floorTexturePresets]);

  const valueType = determineValueType(saveValues.floorValue);
  const currentPreset = floorTexturePresets[floorTexture];

  // 텍스처 로드 (로딩 상태 관리)
  const [texture, setTexture] = React.useState(null);
  const [isTextureLoading, setIsTextureLoading] = React.useState(false);

  React.useEffect(() => {
    if (!valueType.isTexture || currentPreset?.type !== "texture") {
      setTexture(null);
      setIsTextureLoading(false);
      return;
    }

    setIsTextureLoading(true);
    const loader = new THREE.TextureLoader();

    loader.load(
      currentPreset.texture,
      (loadedTexture) => {
        loadedTexture.wrapS = loadedTexture.wrapT = THREE.RepeatWrapping;
        loadedTexture.repeat.set(6, 6);
        loadedTexture.minFilter = THREE.LinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        setTexture(loadedTexture);
        setIsTextureLoading(false);
      },
      undefined,
      (error) => {
        console.error("Floor texture loading failed:", error);
        setTexture(null);
        setIsTextureLoading(false);
      }
    );
  }, [valueType.isTexture, currentPreset?.texture, floorTexture]);

  // 단일 material 생성 (조건에 따라 속성만 변경)
  const material = React.useMemo(() => {
    const mat = new THREE.MeshStandardMaterial();

    // 텍스처 모드인데 아직 로딩중이거나 실패한 경우 색상 모드로 fallback
    if (
      valueType.isColor ||
      currentPreset?.type === "color" ||
      (valueType.isTexture &&
        currentPreset?.type === "texture" &&
        (!texture || isTextureLoading))
    ) {
      mat.color.set(floorColor);
      mat.map = null;
      mat.roughness = 0.9;
      mat.metalness = 0.0;
    } else if (
      valueType.isTexture &&
      texture &&
      currentPreset?.type === "texture" &&
      !isTextureLoading
    ) {
      mat.map = texture;
      mat.color.set(floorColor);
      mat.roughness = 0.9;
      mat.metalness = 0.0;
    } else {
      // 안전한 fallback
      mat.color.set(floorColor);
      mat.map = null;
      mat.roughness = 0.7;
      mat.metalness = 0.0;
    }

    mat.needsUpdate = true;
    return mat;
  }, [
    valueType.isColor,
    valueType.isTexture,
    currentPreset?.type,
    floorColor,
    texture,
    floorTexture,
    isTextureLoading,
  ]);

  return <primitive object={material} />;
}

// 벽지 재질 컴포넌트 (textureUtils 사용)
export function WallMaterial({ wallMaterialColor, transparent = true }) {
  const { wallColor, wallTexture, wallTexturePresets } = useStore();

  // textureUtils로 현재 값 타입 확인
  const { saveValues } = React.useMemo(() => {
    const envState = {
      wallTexture,
      wallColor,
      wallTexturePresets,
      floorTexture: "color",
      floorColor: "#D2B48C",
      floorTexturePresets: {},
    };
    return {
      saveValues: generateSaveValues(envState),
    };
  }, [wallTexture, wallColor, wallTexturePresets]);

  const valueType = determineValueType(saveValues.wallValue);
  const currentPreset = wallTexturePresets[wallTexture];

  // 텍스처 로드 (로딩 상태 관리)
  const [texture, setTexture] = React.useState(null);
  const [isTextureLoading, setIsTextureLoading] = React.useState(false);

  React.useEffect(() => {
    if (!valueType.isTexture || currentPreset?.type !== "texture") {
      setTexture(null);
      setIsTextureLoading(false);
      return;
    }

    setIsTextureLoading(true);
    const loader = new THREE.TextureLoader();

    loader.load(
      currentPreset.texture,
      (loadedTexture) => {
        // 벽지는 꽉채우기 모드
        loadedTexture.wrapS = loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
        loadedTexture.repeat.set(1, 1);
        loadedTexture.minFilter = THREE.LinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        setTexture(loadedTexture);
        setIsTextureLoading(false);
      },
      undefined,
      (error) => {
        console.error("Wall texture loading failed:", error);
        setTexture(null);
        setIsTextureLoading(false);
      }
    );
  }, [valueType.isTexture, currentPreset?.texture, wallTexture]);

  const finalColor = wallMaterialColor || wallColor;

  // 단일 material 생성 (조건에 따라 속성만 변경)
  const material = React.useMemo(() => {
    const mat = new THREE.MeshStandardMaterial();

    // 텍스처 모드인데 아직 로딩중이거나 실패한 경우 색상 모드로 fallback
    if (
      valueType.isColor ||
      currentPreset?.type === "color" ||
      (valueType.isTexture &&
        currentPreset?.type === "texture" &&
        (!texture || isTextureLoading))
    ) {
      mat.color.set(finalColor);
      mat.map = null;
      mat.transparent = transparent;
      mat.roughness = 0.8;
      mat.metalness = 0.1;
    } else if (
      valueType.isTexture &&
      texture &&
      currentPreset?.type === "texture" &&
      !isTextureLoading
    ) {
      mat.map = texture;
      mat.color.set(finalColor);
      mat.transparent = transparent;
      mat.roughness = 0.8;
      mat.metalness = 0.1;
    } else {
      // 안전한 fallback
      mat.color.set(finalColor);
      mat.map = null;
      mat.transparent = transparent;
      mat.roughness = 0.8;
      mat.metalness = 0.1;
    }

    mat.needsUpdate = true;
    return mat;
  }, [
    valueType.isColor,
    valueType.isTexture,
    currentPreset?.type,
    finalColor,
    texture,
    wallTexture,
    transparent,
    isTextureLoading,
  ]);

  return <primitive object={material} />;
}

// 동적 바닥 - 벽 데이터에 따라 내부 영역에만 바닥 렌더링
function Floor({ wallsData }: { wallsData: any[] }) {
  const { floorTexture, floorColor } = useStore();

  // 벽 데이터가 없으면 기본 바닥 렌더링
  if (!wallsData || wallsData.length === 0) {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <FloorMaterial />
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
      <FloorMaterial />
    </mesh>
  );
}

function CameraUpdater({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const fov = useStore((state) => state.cameraFov);
  const showMeasurements = useStore((state) => state.showMeasurements);
  const wallsData = useStore((state) => state.wallsData);
  const { camera } = useThree();
  const perspectiveCamera = camera as THREE.PerspectiveCamera;

  // Calculate centered camera position based on walls
  const { cameraPosition, cameraTarget } = useMemo(() => {
    const wallsCenter = calculateWallsCenter(wallsData);
    const position = calculateOptimalCameraPosition(wallsCenter, wallsData);
    const target = getCameraTarget(wallsCenter);
    
    return {
      cameraPosition: position,
      cameraTarget: target
    };
  }, [wallsData]);

  useEffect(() => {
    perspectiveCamera.fov = fov;
    perspectiveCamera.updateProjectionMatrix();
  }, [fov, perspectiveCamera]);

  // Update camera position when walls change
  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      
      // Set camera position and target based on walls (or fallback for empty walls)
      controls.object.position.set(...cameraPosition);
      controls.target.set(...cameraTarget);
      controls.update();
    }
  }, [cameraPosition, cameraTarget, controlsRef]);

  // 치수 모드 시 탑뷰로 자동 전환
  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;

      if (showMeasurements) {
        // 측정 모드 켜짐: 카메라를 위에서 내려다보는 위치로 이동
        const target = controls.target;
        const topViewPosition = new THREE.Vector3(target.x, 30, target.z);

        // 부드럽게 이동
        controls.object.position.copy(topViewPosition);
        controls.object.lookAt(target);
        controls.update();
      } else {
        // 측정 모드 꺼짐: 카메라 제한 해제하고 계산된 위치로 복귀
        const target = controls.target;
        const defaultPosition = new THREE.Vector3(...cameraPosition);

        // 계산된 위치로 부드럽게 이동
        controls.object.position.copy(defaultPosition);
        controls.object.lookAt(target);
        controls.update();
      }
    }
  }, [showMeasurements, controlsRef, cameraPosition]);

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
  loadingIcon = "",
  keyboardControlsDisabled = false,
  isMobile = false,
  accessType = 1,
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
    previewMode,
    wallToolMode,
    wallDrawingStart,
    setWallDrawingStart,
    addWall,
    removeWall,
    setSelectedWallId,
    isChatFocused,
    showMeasurements,
  } = useStore();

  const [startTime, setStartTime] = useState<number>(0);
  const [loadedModelIds, setLoadedModelIds] = useState(new Set());

  // EditPopup 관련 상태
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [roomInfo, setRoomInfo] = useState<RoomInfo>({
    title: "",
    description: "",
    is_public: false,
  });
  const [isOwnUserRoom, setIsOwnUserRoom] = useState(false);

  const router = useRouter();

  // 방 정보 로딩
  useEffect(() => {
    const loadRoomInfo = async () => {
      if (!roomId || roomId.startsWith("temp_")) return;

      try {
        const info = await fetchRoomInfo(roomId);
        if (info) {
          setRoomInfo(info);
        }
      } catch (error) {
        console.error("방 정보 로드 실패:", error);
      }
    };

    loadRoomInfo();
  }, [roomId]);

  // 방 소유권 확인
  useEffect(() => {
    const checkOwnership = async () => {
      if (!session?.user?.id || !roomId || roomId.startsWith("temp_")) {
        setIsOwnUserRoom(false);
        return;
      }

      try {
        const isOwn = await checkUserRoom(roomId, session.user.id);
        setIsOwnUserRoom(isOwn);
      } catch (error) {
        console.error("방 소유권 확인 실패:", error);
        setIsOwnUserRoom(false);
      }
    };

    checkOwnership();
  }, [session?.user?.id, roomId, checkUserRoom]);

  // EditPopup 관련 함수들
  const handleEditClick = () => {
    setShowEditPopup(true);
  };

  const handleSave = async (
    title: string,
    description: string,
    isPublic: boolean
  ) => {
    const newRoomInfo = { title, description, is_public: isPublic };
    const success = await updateRoomInfo(roomId, newRoomInfo);

    if (success) {
      setRoomInfo(newRoomInfo);
    }

    setShowEditPopup(false);
  };

  const handleDelete = async () => {
    await deleteRoom(roomId);
    setShowEditPopup(false);
    router.push("/");
  };

  const handleOutofRoomClick = () => {
    setShowEditPopup(false);
    router.push("/");
  };

  // 상태 기반 속도 측정
  useEffect(() => {
    if (!loadedModels.length && !startTime) {
      setStartTime(performance.now());
    }
  }, []);

  const handleModelLoaded = useCallback(
    (modelId: string) => {
      setLoadedModelIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(modelId);

        if (newSet.size === loadedModels.length) {
          console.log(
            "모든 모델 실제 로드 완료:",
            performance.now() - startTime
          );
        }

        return newSet;
      });
    },
    [loadedModels.length, startTime]
  );

  // Suspense fallback이 완전히 사라진 후
  // useEffect(() => {
  //   if (startTime && loadedModels.length > 0) {
  //     const endTime = performance.now();
  //     console.log(`모든 모델 로드 완료: ${endTime - startTime}ms`);
  //   }
  // }, [loadedModels]);

  // //HDR 환경 맵 prefetch - 현재 environmentPreset에 따라
  // useEffect(() => {
  //   const hdrPresets = {
  //     apartment: "lebombo_1k",
  //     city: "potsdamer_platz_1k",
  //     warehouse: "empty_warehouse_01_1k",
  //     dawn: "kiara_1_dawn_1k",
  //     sunset: "venice_sunset_1k",
  //     forest: "forest_slope_1k",
  //     lobby: "st_fagans_interior_1k",
  //     night: "dikhololo_night_1k",
  //     park: "rooitou_park_1k",
  //     studio: "studio_small_03_1k",
  //   };

  //   const currentPresetFilename = hdrPresets[environmentPreset];
  //   if (currentPresetFilename) {
  //     const link = document.createElement("link");
  //     link.rel = "prefetch";
  //     link.href = `https://raw.githubusercontent.com/pmndrs/drei-assets/main/hdri/${currentPresetFilename}.hdr`;
  //     document.head.appendChild(link);
  //   }
  // }, [environmentPreset]);

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

  // Calculate initial camera position based on walls
  const initialCameraPosition = useMemo(() => {
    const wallsCenter = calculateWallsCenter(wallsData);
    return calculateOptimalCameraPosition(wallsCenter, wallsData);
  }, [wallsData]);

  return (
    <div
      className={`flex h-screen overflow-hidden ${
        isMobile ? "bg-gray-50" : ""
      }`}
    >
      {/* 조건부 사이드바 표시 */}
      {showSidebar && !viewOnly && (
        <SimSideView
          roomId={roomId}
          accessType={accessType}
          onEditClick={handleEditClick}
          newRoomInfo={roomInfo}
        />
      )}

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

        {/* 프리뷰 모드 UI 힌트 */}
        {previewMode && (
          <div className="fixed top-15 right-5 z-50 pointer-events-none">
            <div className="bg-black bg-opacity-80 text-white px-3 py-2 rounded text-xs whitespace-nowrap">
              클릭하여 배치 | Delete: 취소
            </div>
          </div>
        )}

        {/* 편집 컨트롤 아이콘 */}
        {showEditControls && !viewOnly && (
          <ControlIcons controlsRef={controlsRef} />
        )}

        {/* 벽 도구 드롭다운 */}
        {!viewOnly && <WallTools isDropdown={true} />}

        {!viewOnly && <SelectedModelEditModal />}

        {/* 캡처 모달 */}
        <CaptureModal />

        {/* EditPopup 모달 */}
        {showEditPopup && (
          <EditPopup
            initialTitle={roomInfo.title}
            initialDescription={roomInfo.description}
            initialIsPublic={roomInfo.is_public}
            isOwnUserRoom={isOwnUserRoom}
            onSave={handleSave}
            onDelete={handleDelete}
            onClose={() => setShowEditPopup(false)}
            handleOutofRoomClick={handleOutofRoomClick}
          />
        )}

        <Canvas
          camera={{ position: initialCameraPosition, fov: 60 }}
          shadows
          style={{
            width: "100%",
            height: "100vh",
            marginTop: isMobile ? "60px" : "0", // 모바일 헤더 높이만큼 여백
          }}
          frameloop="demand"
        >
          {/* <Environment preset={environmentPreset} background={false} /> */}

          <CameraUpdater controlsRef={controlsRef} />
          <color attach="background" args={[backgroundColor]} />

          {/* 메인 햇빛 조명 */}
          {/* 메인 햇빛 조명 - 강도 대폭 증가 */}
          <directionalLight
            position={directionalLightPosition}
            intensity={directionalLightIntensity * 2} // 기존 강도의 2배
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

          {/* GLB 파일용 매우 강한 앰비언트 조명 */}
          <ambientLight intensity={4.5} color="#ffffff" />

          {/* 사방에서 비추는 강력한 방향성 조명 */}
          <directionalLight
            position={[15, 15, 15]}
            intensity={3.5} // 기존 1.5 → 3.5
            color="#ffffff"
          />
          <directionalLight
            position={[-15, 15, -15]}
            intensity={3.5}
            color="#ffffff"
          />
          <directionalLight
            position={[0, 15, 15]}
            intensity={3.0} // 기존 1.2 → 3.0
            color="#ffffff"
          />
          <directionalLight
            position={[0, 15, -15]}
            intensity={3.0}
            color="#ffffff"
          />

          {/* 가구 디테일용 매우 강력한 포인트 조명 */}
          <pointLight
            position={[0, 18, 0]}
            intensity={6.0} // 기존 2.5 → 6.0
            distance={60}
            decay={0.5} // decay 낮춤 (더 멀리 퍼짐)
            color="#ffffff"
          />
          <pointLight
            position={[-12, 12, -12]}
            intensity={4.5} // 기존 1.8 → 4.5
            distance={50}
            decay={0.8}
            color="#ffffff"
          />
          <pointLight
            position={[12, 12, 12]}
            intensity={4.5}
            distance={50}
            decay={0.8}
            color="#ffffff"
          />
          <pointLight
            position={[12, 12, -12]}
            intensity={4.5}
            distance={50}
            decay={0.8}
            color="#ffffff"
          />
          <pointLight
            position={[-12, 12, 12]}
            intensity={4.5}
            distance={50}
            decay={0.8}
            color="#ffffff"
          />

          {/* 추가 보조 조명 - GLB 파일 전체를 밝게 */}
          <pointLight
            position={[0, -5, 0]} // 아래에서 올려 비추기
            intensity={3.0}
            distance={40}
            decay={1.2}
            color="#ffffff"
          />
          <directionalLight
            position={[0, -10, 0]} // 바닥에서 위로
            intensity={2.0}
            color="#ffffff"
          />
          <Floor wallsData={wallsData} />

          {/* 벽 렌더링 - 자동 병합 적용 */}
          {wallsData.length > 0 ? (
            <MergedWalls wallsData={wallsData} />
          ) : (
            <>
              <Wall
                id="default-wall-north"
                width={20}
                height={5}
                position={[0, 2.5, -10]}
                rotation={[0, 0, 0]}
              />
              <Wall
                id="default-wall-west"
                width={20}
                height={5}
                position={[-10, 2.5, 0]}
                rotation={[0, Math.PI / 2, 0]}
              />
              <Wall
                id="default-wall-east"
                width={20}
                height={5}
                position={[10, 2.5, 0]}
                rotation={[0, -Math.PI / 2, 0]}
              />
              <Wall
                id="default-wall-south"
                width={20}
                height={5}
                position={[0, 2.5, 10]}
                rotation={[0, Math.PI, 0]}
              />
            </>
          )}

          {useMemo(
            () =>
              loadedModels.map((model: any) => (
                <Suspense key={model.id} fallback={null}>
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
                    onModelLoaded={handleModelLoaded}
                  />
                </Suspense>
              )),
            [loadedModels, controlsRef]
          )}

          {/* 프리뷰 모드 */}
          <Suspense fallback={null}>
            <PreviewManager />
          </Suspense>

          <mesh
            position={[0, -0.01, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerDown={(event) => {
              // 벽 추가 모드에서의 바닥 클릭 처리
              if (wallToolMode === "add") {
                if (event.button != 0) return;

                event.stopPropagation();
                const point = event.point;
                const clickPoint = [point.x, 0, point.z];

                // 스냅 포인트 근처인지 확인하고 자동으로 스냅
                const snappedPoint = autoSnapToNearestWallEndpoint(
                  clickPoint,
                  wallsData,
                  1.0
                );

                if (!wallDrawingStart) {
                  // 시작점 설정
                  setWallDrawingStart(snappedPoint);
                } else {
                  // 직선 벽을 위한 좌표 정렬
                  let alignedEndPoint = snappedPoint;

                  // 시작점과 끝점이 다를 때만 정렬 처리
                  if (
                    wallDrawingStart[0] !== snappedPoint[0] ||
                    wallDrawingStart[2] !== snappedPoint[2]
                  ) {
                    const deltaX = Math.abs(
                      snappedPoint[0] - wallDrawingStart[0]
                    );
                    const deltaZ = Math.abs(
                      snappedPoint[2] - wallDrawingStart[2]
                    );

                    // 더 긴 축을 기준으로 직선 벽 생성
                    if (deltaX > deltaZ) {
                      // X축 방향 벽 (Z좌표를 시작점과 동일하게)
                      alignedEndPoint = [
                        snappedPoint[0],
                        0,
                        wallDrawingStart[2],
                      ];
                    } else {
                      // Z축 방향 벽 (X좌표를 시작점과 동일하게)
                      alignedEndPoint = [
                        wallDrawingStart[0],
                        0,
                        snappedPoint[2],
                      ];
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
            enableRotate={!showMeasurements}
            enablePan={true}
            enableDamping={false}
            rotateSpeed={isMobile ? 0.8 : 0.3}
            panSpeed={showMeasurements ? 1.5 : isMobile ? 1.0 : 0.5}
            zoomSpeed={isMobile ? 0.8 : 1.0}
            minDistance={isMobile ? 1 : 8}
            maxDistance={50}
            maxPolarAngle={
              showMeasurements
                ? (Math.PI * 18) / 180
                : isMobile
                ? Math.PI * 0.95
                : Math.PI
            }
            minPolarAngle={
              showMeasurements
                ? (Math.PI * 18) / 180
                : isMobile
                ? Math.PI * 0.05
                : 0
            }
            mouseButtons={{
              LEFT: showMeasurements ? 2 : 0, // 측정 모드에서는 왼쪽 클릭으로 패닝
              MIDDLE: 1, // 휠 클릭으로 줌
              RIGHT: showMeasurements ? undefined : 2, // 측정 모드에서는 우클릭 비활성화
            }}
            touches={
              isMobile
                ? {
                    ONE: showMeasurements ? 2 : 0, // 측정 모드에서는 한 손가락으로 패닝
                    TWO: 1, // 두 손가락으로 확대축소
                  }
                : undefined
            }
          />

          {/* 벽 그리기 프리뷰 */}
          <WallPreview />

          {/* 벽 스냅 포인트 */}
          <WallSnapPoints />

          {/* 측정 표시 */}
          <Suspense fallback={null}>
            <WallMeasurements />
            <ObjectMeasurements />
          </Suspense>

          {/* Canvas 내부 추가 요소들 (협업 모드 커서 등) */}
          {canvasChildren}

          <CanvasImageLogger />
          <CaptureHandler />
        </Canvas>
      </div>
    </div>
  );
}
