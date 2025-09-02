import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import * as THREE from "three";

function sphericalToCartesian(radius, azimuth, elevation) {
  const x =
    radius *
    Math.cos(THREE.MathUtils.degToRad(elevation)) *
    Math.cos(THREE.MathUtils.degToRad(azimuth));
  const y = radius * Math.sin(THREE.MathUtils.degToRad(elevation));
  const z =
    radius *
    Math.cos(THREE.MathUtils.degToRad(elevation)) *
    Math.sin(THREE.MathUtils.degToRad(azimuth));
  return [x, y, z];
}

export const useStore = create(
  subscribeWithSelector((set, get) => ({
    // 보기/편집 모드
    viewOnly: false,
    setViewOnly: (value) => set({ viewOnly: value }),

    // 모델 관련 상태
    loadedModels: [],
    selectedModelId: null,
    hoveringModelId: null,
    scaleValue: 1,

    // 방에 접근한 유저가 오너인지 확인
    isOwnUserRoom: false,

    // 액션으로 분리
    checkUserRoom: async (roomId, userId) => {
      try {
        const response = await fetch(`/api/rooms/user?roomId=${roomId}&userId=${userId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const result = await response.json();
        if (result) {
          set({ isOwnUserRoom: true});
        } else {
          set({ isOwnUserRoom: false});
        }

        return result ? true : false;
      } catch (error) {
        console.error('FETCH ERROR:', error);
        set({ isOwnUserRoom: false });
      }
    },

    // 모델 액션들
    addModel: (model) =>
      set((state) => {
        // scale 값 검증 및 최소값 보장
        let scale = model.scale || state.scaleValue;
        if (Array.isArray(scale)) {
          scale = scale.map((s) => (s <= 0 || s < 0.01 ? 1 : s));
        } else if (typeof scale === "number") {
          scale = scale <= 0 || scale < 0.01 ? 1 : scale;
        } else {
          scale = 1;
        }

        return {
          loadedModels: [
            ...state.loadedModels,
            {
              ...model,
              id: Date.now() + Math.random(),
              position: model.position || [
                (Math.random() - 0.5) * 15,
                0,
                (Math.random() - 0.5) * 15,
              ],
              rotation: model.rotation || [0, 0, 0],
              scale: scale,
            },
          ],
        };
      }),

    removeModel: (modelId) =>
      set((state) => {
        const model = state.loadedModels.find((m) => m.id === modelId);
        if (model && model.url) {
          URL.revokeObjectURL(model.url);
        }
        return {
          loadedModels: state.loadedModels.filter((m) => m.id !== modelId),
        };
      }),

    clearAllModels: () =>
      set((state) => {
        state.loadedModels.forEach((model) => {
          if (model.url) URL.revokeObjectURL(model.url);
        });
        return { loadedModels: [] };
      }),

    updateModelPosition: (modelId, newPosition) =>
      set((state) => ({
        loadedModels: state.loadedModels.map((model) =>
          model.id === modelId ? { ...model, position: newPosition } : model
        ),
      })),

    updateModelRotation: (modelId, newRotation) =>
      set((state) => ({
        loadedModels: state.loadedModels.map((model) =>
          model.id === modelId ? { ...model, rotation: newRotation } : model
        ),
      })),

    updateModelScale: (modelId, newScale) =>
      set((state) => {
        // scale 값 검증 및 최소값 보장
        let scale = newScale;
        if (Array.isArray(scale)) {
          scale = scale.map((s) => (s <= 0 || s < 0.01 ? 0.01 : s));
        } else if (typeof scale === "number") {
          scale = scale <= 0 || scale < 0.01 ? 0.01 : scale;
        } else {
          scale = 1;
        }

        return {
          loadedModels: state.loadedModels.map((model) =>
            model.id === modelId ? { ...model, scale: scale } : model
          ),
        };
      }),

    // 선택, 마우스 호버링 관련
    selectModel: (modelId) => set({ selectedModelId: modelId }),
    deselectModel: () => set({ selectedModelId: null }),
    hoveringModel: (modelId) => set({ hoveringModelId: modelId }),

    // 스케일 값 설정
    setScaleValue: (value) => set({ scaleValue: value }),

    // 빛 상태
    ambientLightIntensity: 0.4,
    directionalLightPosition: [26, 15, 0],
    directionalLightAzimuth: 0,
    directionalLightElevation: 30,
    directionalLightIntensity: 0.9,

    // 빛 액션
    setAmbientLightIntensity: (intensity) =>
      set({ ambientLightIntensity: intensity }),
    setDirectionalLightAzimuth: (azimuth) =>
      set({
        directionalLightAzimuth: azimuth,
        directionalLightPosition: sphericalToCartesian(
          30,
          azimuth,
          get().directionalLightElevation
        ),
      }),
    setDirectionalLightElevation: (elevation) =>
      set({
        directionalLightElevation: elevation,
        directionalLightPosition: sphericalToCartesian(
          30,
          get().directionalLightAzimuth,
          elevation
        ),
      }),
    setDirectionalLightIntensity: (intensity) =>
      set({ directionalLightIntensity: intensity }),

    // 카메라 상태
    cameraFov: 30, // Perspective
    // cameraZoom: 50,   // Orthographic
    // cameraMode: 'perspective', // Perspective | Orthographic

    // 카메라 액션
    setCameraFov: (fov) => set({ cameraFov: fov }),
    // setCameraMode: (mode) => set({ cameraMode: mode }),

    //[09.01] wallscalefactor 로 벽 조정 가능합니다.
    currentRoomId: null,
    isSaving: false,
    isLoading: false,
    lastSavedAt: null,
    shouldCapture: false,
    wallsData: [],
    wallScaleFactor: 1.0, // 벽 크기 조정 팩터

    // 저장/로드 액션
    setCurrentRoomId: (roomId) => set({ currentRoomId: roomId }),
    setWallsData: (walls) => set({ wallsData: walls }),
    setWallScaleFactor: (factor) => set({ wallScaleFactor: factor }),

    setSaving: (saving) => set({ isSaving: saving }),

    setLoading: (loading) => set({ isLoading: loading }),

    setShouldCapture: (capture) => set({ shouldCapture: capture }),

    // 시뮬레이터 상태 저장
    saveSimulatorState: async () => {
      const state = get();
      if (!state.currentRoomId) {
        throw new Error("방 ID가 설정되지 않았습니다");
      }

      set({ isSaving: true });

      try {
        const objects = state.loadedModels.map((model) => {
          // furniture_id가 없는 경우 (직접 업로드한 GLB) 임시 UUID 생성하지 않고 null 유지
          return {
            furniture_id: model.furniture_id, // null일 수 있음
            position: model.position,
            rotation: model.rotation,
            scale: Array.isArray(model.scale)
              ? model.scale
              : [model.scale, model.scale, model.scale],
            url: model.url,
            isCityKit: model.isCityKit || false,
            texturePath: model.texturePath || null,
            type: model.type || "glb",
          };
        });

        // 임시 room_id인 경우 먼저 방 생성
        if (state.currentRoomId.startsWith("temp_")) {
          const floorPlanData = JSON.parse(
            localStorage.getItem("floorPlanData") || "{}"
          );
          const roomData = floorPlanData.roomData || {};

          // 방 생성
          const createRoomResponse = await fetch("/api/rooms", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: roomData.title || `Room ${new Date().toLocaleString()}`,
              description: roomData.description || "Generated room",
              room_data: floorPlanData,
              is_public: roomData.is_public || false,
            }),
          });

          if (!createRoomResponse.ok) {
            throw new Error("방 생성 실패");
          }

          const roomResult = await createRoomResponse.json();
          const newRoomId = roomResult.room_id;

          // 새로운 room_id로 업데이트
          set({ currentRoomId: newRoomId });

          // URL도 업데이트 (임시로 현재 URL 수정)
          if (typeof window !== "undefined") {
            window.history.replaceState({}, "", `/sim/${newRoomId}`);
          }

          console.log(`새 방 생성 완료: ${newRoomId}`);

          // 벽 데이터가 있으면 room_walls 테이블에 저장
          if (floorPlanData.walls && floorPlanData.pixelToMmRatio) {
            try {
              const wallsResponse = await fetch(
                `/api/room-walls/${newRoomId}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    walls: floorPlanData.walls,
                    pixelToMmRatio: floorPlanData.pixelToMmRatio,
                  }),
                }
              );

              if (wallsResponse.ok) {
                const wallsResult = await wallsResponse.json();
                console.log(
                  `벽 데이터 저장 완료: ${wallsResult.saved_count}개 벽`
                );
              } else {
                console.error("벽 데이터 저장 실패:", wallsResponse.statusText);
              }
            } catch (wallError) {
              console.error("벽 데이터 저장 중 오류:", wallError);
            }
          }
        }

        const currentState = get();

        // 벽 스케일 팩터가 1이 아닌 경우, 벽 데이터도 DB에 업데이트
        if (
          currentState.wallScaleFactor !== 1.0 &&
          currentState.wallsData.length > 0
        ) {
          try {
            // 현재 스케일 팩터가 적용된 벽 데이터를 DB 형식으로 변환
            const scaledWalls = currentState.wallsData.map((wall) => ({
              start: {
                x:
                  wall.position[0] -
                  (wall.dimensions.width / 2) * Math.cos(wall.rotation[1]),
                y:
                  wall.position[2] -
                  (wall.dimensions.width / 2) * Math.sin(wall.rotation[1]),
              },
              end: {
                x:
                  wall.position[0] +
                  (wall.dimensions.width / 2) * Math.cos(wall.rotation[1]),
                y:
                  wall.position[2] +
                  (wall.dimensions.width / 2) * Math.sin(wall.rotation[1]),
              },
            }));

            const updateWallsResponse = await fetch(
              `/api/room-walls/${currentState.currentRoomId}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  walls: scaledWalls,
                  pixelToMmRatio: 1000, // 이미 미터 단위로 변환된 값이므로 1000으로 설정
                }),
              }
            );

            if (updateWallsResponse.ok) {
              console.log("벽 데이터 업데이트 완료");
            } else {
              console.warn(
                "벽 데이터 업데이트 실패:",
                updateWallsResponse.statusText
              );
            }
          } catch (wallUpdateError) {
            console.error("벽 데이터 업데이트 중 오류:", wallUpdateError);
          }
        }

        // 가구 데이터 저장 (새 room_id 또는 기존 room_id 사용)
        const response = await fetch("/api/sim/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            room_id: currentState.currentRoomId,
            objects: objects,
          }),
        });

        if (!response.ok) {
          throw new Error(`저장 실패: ${response.statusText}`);
        }

        const result = await response.json();
        set({ lastSavedAt: new Date() });
        console.log("시뮬레이터 상태 저장 완료:", result);
        return result;
      } catch (error) {
        console.error("저장 중 오류:", error);
        throw error;
      } finally {
        set({ isSaving: false });
      }
    },

    // 시뮬레이터 상태 로드
    loadSimulatorState: async (roomId) => {
      set({ isLoading: true });

      try {
        const response = await fetch(`/api/sim/load/${roomId}`);

        if (!response.ok) {
          throw new Error(`로드 실패: ${response.statusText}`);
        }

        const result = await response.json();

        // 기존 모델들 정리
        const currentState = get();
        currentState.loadedModels.forEach((model) => {
          if (model.url) URL.revokeObjectURL(model.url);
        });

        // 로드된 객체들을 loadedModels에 설정
        const loadedModels = result.objects.map((obj) => {
          // scale 값 검증 및 최소값 보장
          let scale = obj.scale;
          if (Array.isArray(scale)) {
            // 배열 형태의 scale에서 0이나 매우 작은 값들을 1로 대체
            scale = scale.map((s) => (s <= 0 || s < 0.01 ? 1 : s));
          } else if (typeof scale === "number") {
            // 단일 숫자 scale에서 0이나 매우 작은 값을 1로 대체
            scale = scale <= 0 || scale < 0.01 ? 1 : scale;
          } else {
            // scale이 없거나 잘못된 형태인 경우 기본값 1 사용
            scale = 1;
          }
          console.log("obj", obj);

          return {
            id: obj.id,
            object_id: obj.object_id,
            furniture_id: obj.furniture_id,
            name: obj.name,
            position: obj.position,
            rotation: obj.rotation,
            scale: scale,
            length: [obj.length[0], obj.length[1], obj.length[2]],
            url: obj.url,
            isCityKit: obj.isCityKit,
            texturePath: obj.texturePath,
            type: obj.type,
            furnitureName: obj.furnitureName,
            categoryId: obj.categoryId,
          };
        });

        // 벽 데이터 처리
        let wallsData = [];
        if (result.walls && result.walls.length > 0) {
          const scaleFactor = get().wallScaleFactor;
          wallsData = result.walls.map((wall) => ({
            id: wall.id,
            dimensions: {
              width: wall.length * scaleFactor,
              height: wall.height,
              depth: wall.depth,
            },
            position: [
              wall.position[0] * scaleFactor,
              wall.position[1],
              wall.position[2] * scaleFactor,
            ],
            rotation: wall.rotation,
          }));
        }

        set({
          loadedModels: loadedModels,
          wallsData: wallsData,
          currentRoomId: roomId,
          selectedModelId: null,
          currentRoomInfo: {
            title: result.room_info?.title || "",
            description: result.room_info?.description || "",
            is_public: result.room_info?.is_public || false,
          },
        });

        console.log(
          `시뮬레이터 상태 로드 완료: ${result.loaded_count}개 객체, ${wallsData.length}개 벽`
        );
        return result;
      } catch (error) {
        console.error("로드 중 오류:", error);
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },
  }))
);
