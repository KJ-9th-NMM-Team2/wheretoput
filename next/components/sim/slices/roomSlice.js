export const roomSlice = (set, get) => ({
  currentRoomId: null,
  isSaving: false,
  isCloning: false,
  isLoading: false,
  lastSavedAt: null,
  shouldCapture: false,
  shouldCaptureDownload: false,

  // 방에 접근한 유저가 오너인지 확인
  isOwnUserRoom: false, //초기값 false

  // 현재 방의 협업 모드 활성화 상태
  isCollabModeActive: false,

  setCurrentRoomId: (roomId) => set({ currentRoomId: roomId }),
  setSaving: (saving) => set({ isSaving: saving }),
  setCloning: (cloning) => set({ isCloning: cloning }),
  setLoading: (loading) => set({ isLoading: loading }),
  setShouldCapture: (capture) => set({ shouldCapture: capture }),
  setShouldCaptureDownload: (capture) =>
    set({ shouldCaptureDownload: capture }),

  checkUserRoom: async (roomId, userId) => {
    try {
      if (!roomId || !userId) {
        console.warn("checkUserRoom: roomId 또는 userId가 없습니다", {
          roomId,
          userId,
        });
        set({ isOwnUserRoom: false });
        return false;
      }

      const response = await fetch(
        `/api/rooms/user?roomId=${roomId}&userId=${userId}`
      );

      if (!response.ok) {
        console.error(
          `checkUserRoom API 오류: ${response.status} ${response.statusText}`
        );
        throw new Error(`Network response was not ok: ${response.status}`);
      }

      const result = await response.json();

      if (result) {
        set({ isOwnUserRoom: true });
      } else {
        set({ isOwnUserRoom: false });
      }

      return result ? true : false;
    } catch (error) {
      console.error("checkUserRoom FETCH ERROR:", error);
      set({ isOwnUserRoom: false });
    }
  },

  checkCollabMode: async (roomId) => {
    try {
      const { getColab } = await import("@/lib/api/toggleColab");
      const collabResult = await getColab(roomId);

      if (collabResult.success) {
        set({ isCollabModeActive: collabResult.data.collab_on });
        return collabResult.data.collab_on;
      } else {
        set({ isCollabModeActive: false });
        return false;
      }
    } catch (error) {
      console.error("협업 모드 상태 확인 실패:", error);
      set({ isCollabModeActive: false });
      return false;
    }
  },

  cloneSimulatorState: async () => {
    const state = get();
    if (!state.currentRoomId) {
      throw new Error("방 ID가 설정되지 않았습니다");
    }

    set({ isCloning: true });

    try {
      const objects = state.loadedModels.map((model) => {
        return {
          furniture_id: model.furniture_id,
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

      const createCloneRoom = await fetch(`/api/rooms/clone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_id: state.currentRoomId,
        }),
      });

      if (!createCloneRoom.ok) {
        throw new Error(`방 복제 실패: ${createCloneRoom.statusText}`);
      }

      const cloneResult = await createCloneRoom.json();
      const clonedId = cloneResult.room_id;

      const currentState = get();

      if (currentState.wallsData.length > 0) {
        try {
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
            `/api/room-walls/${clonedId}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                walls: scaledWalls,
                pixelToMmRatio: 1000,
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

      const furnResponse = await fetch("/api/sim/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_id: clonedId,
          objects: objects,
          wallColor: currentState.wallColor,
          floorColor: currentState.floorColor,
          backgroundColor: currentState.backgroundColor,
          environmentPreset: currentState.environmentPreset,
          wallType: currentState.wallTexture,
          floorType: currentState.floorTexture,
        }),
      });

      if (!furnResponse.ok) {
        throw new Error(`복제 실패: ${furnResponse.statusText}`);
      }

      return { room_id: clonedId };
    } catch (error) {
      console.error("복제 중 오류:", error);
      throw error;
    } finally {
      set({ isCloning: false });
    }
  },

  saveSimulatorState: async () => {
    const state = get();

    if (!state.currentRoomId) {
      throw new Error("방 ID가 설정되지 않았습니다");
    }

    set({ isSaving: true });

    try {
      const objects = state.loadedModels.map((model) => {
        return {
          furniture_id: model.furniture_id,
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

      if (state.currentRoomId.startsWith("temp_")) {
        const floorPlanData = JSON.parse(
          localStorage.getItem("floorPlanData") || "{}"
        );
        const roomData = floorPlanData.roomData || {};

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

        set({ currentRoomId: newRoomId });

        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", `/sim/${newRoomId}`);
        }

        console.log(`새 방 생성 완료: ${newRoomId}`);

        if (floorPlanData.walls && floorPlanData.pixelToMmRatio) {
          try {
            const wallsResponse = await fetch(`/api/room-walls/${newRoomId}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                walls: floorPlanData.walls,
                pixelToMmRatio: floorPlanData.pixelToMmRatio,
              }),
            });

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

      if (currentState.wallsData.length > 0) {
        try {
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
                pixelToMmRatio: 1000,
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

      const response = await fetch("/api/sim/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_id: currentState.currentRoomId,
          objects: objects,
          wallColor: currentState.wallColor,
          floorColor: currentState.floorColor,
          backgroundColor: currentState.backgroundColor,
          environmentPreset: currentState.environmentPreset,
          wallType: currentState.wallTexture,
          floorType: currentState.floorTexture,
        }),
      });

      if (!response.ok) {
        throw new Error(`저장 실패: ${response.statusText}`);
      }
      const result = await response.json();
      set({ lastSavedAt: new Date() });
      return result;
    } catch (error) {
      console.error("저장 중 오류:", error);
      throw error;
    } finally {
      set({ isSaving: false });
    }

  },

  loadSimulatorState: async (roomId, options = {}) => {
    const { wallsOnly = false } = options;
    set({ isLoading: true });

    try {
      const start_time = performance.now();

      
      let loadedModels = [];
      const response = await fetch(`/api/sim/load/${roomId}`);

      if (!response.ok) {
        throw new Error(`로드 실패: ${response.statusText}`);
      }

      const result = await response.json();
      if (!wallsOnly) {
        const currentState = get();
        currentState.loadedModels.forEach((model) => {
          if (model.url) URL.revokeObjectURL(model.url);
        });

        loadedModels = result.objects.map((obj) => {
          let scale = obj.scale;
          if (Array.isArray(scale)) {
            scale = scale.map((s) => (s <= 0 || s < 0.01 ? 1 : s));
          } else if (typeof scale === "number") {
            scale = scale <= 0 || scale < 0.01 ? 1 : scale;
          } else {
            scale = 1;
          }
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
      } else {
        loadedModels = get().loadedModels;
      }

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

      // 직접 색상과 텍스처 정보 추출
      const wallColor = result.wall_color || "#FFFFFF";
      const floorColor = result.floor_color || "#D2B48C";
      const wallTexture = result.wall_type || "color";
      const floorTexture = result.floor_type || "color";

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
        wallColor: wallColor,
        floorColor: floorColor,
        wallTexture: wallTexture,
        floorTexture: floorTexture,
        backgroundColor: result.background_color || "#87CEEB",
        environmentPreset: result.environment_preset || "apartment",
      });

      const end_time = performance.now();
      const duration = end_time - start_time;
      console.log(`시뮬레이터 상태 로드 완료: ${duration}ms`);

      return result;
    } catch (error) {
      console.error("로드 중 오류:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
});
