import { useEffect, useRef, useState } from "react";
import { useStore } from "@/components/sim/useStore.js";
import { io } from "socket.io-client";
import { connectSocket as startSocket } from "@/lib/client/socket";
import { useRouter } from "next/navigation";

/**
 * 실시간 협업을 위한 WebSocket 연결 관리 훅
 *
 * 주요 기능:
 * - WebSocket 연결/해제 관리
 * - 사용자 입장/퇴장 처리
 * - 실시간 모델 조작 동기화 (이동, 회전, 크기조정)
 * - 사용자 선택 상태 동기화
 */
export function useCollaboration(roomId) {
  const socket = useRef(null);
  const isManualDisconnect = useRef(false);
  const [showCollaborationEndNotice, setShowCollaborationEndNotice] =
    useState(false);

  const {
    collaborationMode,
    currentUser,
    setConnectionStatus,
    updateConnectedUser,
    removeConnectedUser,
    clearConnectedUsers,
    addModel,
    addModelWithId,
    removeModel,
    updateModelPosition,
    updateModelRotation,
    updateModelScale,
    selectModel,
    setCollaborationCallbacks,
    connectedUsers,
    saveSimulatorState,
    addWall,
    addWallWithId,
    removeWall,
    setWallColor,
    setFloorColor,
    setBackgroundColor,
    setEnvironmentPreset,
    setWallTexture,
    setFloorTexture,
    setUseOriginalTexture,
    setUseOriginalWallTexture,
  } = useStore();

  const router = useRouter();

  // 협업 종료 브로드캐스트 함수
  const broadcastCollaborationEnd = () => {
    if (socket.current && socket.current.connected) {
      // console.log("🔚 협업 종료 알림을 다른 사용자들에게 전송");
      socket.current.emit("collaboration-ended", {
        ownerId: currentUser.id,
        roomId,
        message: "방 소유자가 협업 모드를 종료했습니다",
      });
    }
  };

  // Socket.IO 연결 초기화
  const connectSocket = async () => {
    // console.log("소켓접속 시도중");
    if (!roomId || !collaborationMode) return;

    try {
      const res = await fetch("/api/chat/token", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      // console.log("토큰 응답:", data);
      const token = data["tokenData"]?.["jti"] || data.token;
      // console.log("추출된 토큰:", token);
      socket.current = startSocket(token, "/collab");
      // console.log("소켓:", socket.current);

      socket.current.on("connect", () => {
        // console.log("🔗 협업 모드 연결됨");
        setConnectionStatus(true);

        // 방 입장
        socket.current.emit("join-room", roomId);

        // 협업 모드에서는 바로 사용자 입장 처리
        // console.log("협업 모드 연결 완료, 즉시 사용자 입장 처리");
        socket.current.emit("user-join", {
          userId: currentUser.id,
          userData: {
            name: currentUser.name,
            color: currentUser.color,
          },
        });
      });

      // 이벤트 리스너 등록
      setupSocketListeners();

      socket.current.on("disconnect", async () => {
        // console.log("🔌 협업 연결 끊김");
        setConnectionStatus(false);
      });

      socket.current.on("connect_error", (error) => {
        console.error("❌ 협업 연결 오류:", error);
      });
    } catch (error) {
      console.error("WebSocket 연결 실패:", error);
    }
  };

  // Socket.IO 이벤트 리스너 설정
  const setupSocketListeners = () => {
    if (!socket.current) return;

    socket.current.on("user-join", (data) => {
      updateConnectedUser(data.userId, data.userData);
      // console.log(`👤 ${data.userData.name}님이 입장했습니다`);
    });

    socket.current.on("user-left", async (data) => {
      // console.log("🔴 user-left 이벤트 수신:", data, roomId);

      if (data.userId === currentUser.id && !isManualDisconnect.current) {
        // 협업 종료로 인한 퇴장인지 일반 퇴장인지 구분
        // 방소유주한테는 모달창 띄우지 않음
        if (
          data.reason === "collaboration-ended" &&
          data.ownerId !== currentUser.id
        ) {
          setShowCollaborationEndNotice(true);
        } else if (data.reason === "time-out") {
          alert("비활성 상태로 인해 방에서 퇴장되었습니다.");
          router.replace(roomId ? `/sim/${roomId}` : `/`);
        } else if (data.reason === "duplicate-connection") {
          alert(
            `동일한 계정으로 다른 탭에서 접속하여 현재 연결이 해제되었습니다.`
          );
          window.location.href = roomId ? `/sim/${roomId}` : `/`;
        }
      } else {
        // 사용자 정보 제거
        removeConnectedUser(data.userId);
        // console.log(
        //   `👋 ${data.userData?.name || data.userId}님이 퇴장했습니다`
        // );
        // console.log(
        //   "퇴장 후 connectedUsers:",
        //   useStore.getState().connectedUsers
        // );
      }
    });

    socket.current.on("request-user-list", (data) => {
      // 기존 사용자가 새로 입장한 사용자에게 자신의 정보를 전송
      socket.current.emit("user-info-response", {
        userId: currentUser.id,
        userData: { name: currentUser.name, color: currentUser.color },
        targetSocketId: data.newUserId,
      });
    });

    // Redis 기반 초기 방 상태 수신 (전체 상태 적용)
    socket.current.on("initial-room-state", (data) => {
      const store = useStore.getState();

      // 기존 로드된 모델들 초기화 (Redis가 단일 진실 소스)
      store.loadedModels.forEach((model) => {
        removeModel(model.id, false);
      });

      // Redis의 모든 모델을 새로 추가 (GLB 캐시 로직 적용)
      if (data.models && data.models.length > 0) {
        data.models.forEach(async (redisModel, index) => {
          try {
            // furniture_id가 있고 Redis GLB 캐시를 활용할 수 있는 경우
            try {
              const response = await fetch("/api/model-upload", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  furniture_id: redisModel.furniture_id,
                }),
              });

              if (response.ok) {
                const result = await response.json();
                if (result.success && result.model_url) {
                  // Redis 캐시 또는 S3에서 로드된 모델 URL로 업데이트
                  const modelWithCachedUrl = {
                    ...redisModel,
                    url: result.model_url,
                    glbData: result.model_url
                  };
                  addModelWithId(modelWithCachedUrl, false);
                  // console.log(`✅ 모델 ${redisModel.id} Redis GLB 캐시 로드 성공`);
                  return;
                }
              }
            } catch (apiError) {
              console.error(
                `❌ 모델 ${redisModel.id} API 호출 실패:`,
                apiError
              );
            }

            // 기본 모델 추가 (furniture_id가 없거나 API 호출 실패 시)
            addModelWithId(redisModel, false);
            // console.log(`✅ 모델 ${redisModel.id} 기본 추가 성공`);
          } catch (error) {
            console.error(`❌ 모델 ${redisModel.id} 추가 실패:`, error);
          }
        });
      } else {
        // console.log("📭 Redis에 저장된 모델이 없음");
      }

      // 연결된 사용자 정보 업데이트
      if (data.connectedUsers) {
        data.connectedUsers.forEach(([userId, userData]) => {
          if (userId !== currentUser.id) {
            // console.log(`기존 사용자 정보 업데이트: ${userData.name}`);
            updateConnectedUser(userId, userData);
          }
        });
      }
    });

    // 새로 입장한 사용자가 기존 사용자들의 정보를 받음
    socket.current.on("user-info-response", (data) => {
      if (data.userId !== currentUser.id) {
        updateConnectedUser(data.userId, data.userData);
        // console.log(
        //   `📋 기존 사용자 확인: ${data.userData.name}님이 이미 접속해 있습니다`
        // );
      } else {
        // console.log(`🔄 자신의 정보는 무시: ${data.userData.name}`);
      }
    });

    socket.current.on("model-added", (data) => {
      if (data.userId !== currentUser.id) {
        // console.log("➕ model-added 이벤트 수신:", data);
        addModel(data.modelData, false);
      }
    });

    socket.current.on("model-added-with-id", (data) => {
      if (data.userId !== currentUser.id) {
        // console.log("➕ model-added-with-id 이벤트 수신:", data);
        addModelWithId(data.modelData, false); // shouldBroadcast = false
      }
    });

    socket.current.on("model-removed", (data) => {
      if (data.userId !== currentUser.id) {
        removeModel(data.modelId, false); // shouldBroadcast = false
      }
    });

    socket.current.on("model-moved", (data) => {
      if (data.userId !== currentUser.id) {
        updateModelPosition(data.modelId, data.position, false); // shouldBroadcast = false
      }
    });

    socket.current.on("model-rotated", (data) => {
      if (data.userId !== currentUser.id) {
        updateModelRotation(data.modelId, data.rotation, false); // shouldBroadcast = false
      }
    });

    socket.current.on("model-scaled", (data) => {
      if (data.userId !== currentUser.id) {
        updateModelScale(data.modelId, data.scale, false); // shouldBroadcast = false
      }
    });

    socket.current.on("model-select", (data) => {
      // console.log("🔥 model-select 이벤트 수신:", data);
      if (data.userId !== currentUser.id) {
        updateConnectedUser(data.userId, {
          selectedModelId: data.modelId,
          showTooltip: true,
          tooltipModelId: data.modelId,
        });
      }
    });

    socket.current.on("model-deselect", (data) => {
      // console.log("🔥 model-deselect 이벤트 수신:", data);
      if (data.userId !== currentUser.id) {
        updateConnectedUser(data.userId, {
          selectedModelId: null,
          showTooltip: false,
          tooltipModelId: null,
        });
      }
    });

    // 🔒 서버에서 락 획득 실패 (다른 사용자가 먼저 선택함)
    socket.current.on("model-select-denied", (data) => {
      const store = useStore.getState();
      if (store.selectedModelId === data.modelId) {
        store.deselectModel(false);
      }
      if (data.ownerId && data.ownerId !== currentUser.id) {
        updateConnectedUser(data.ownerId, {
          selectedModelId: data.modelId,
          showTooltip: true,
          tooltipModelId: data.modelId,
        });
      }
    });

    socket.current.on("wall-color-changed", (data) => {
      if (data.userId !== currentUser.id) {
        setWallColor(data.color, false);
      }
    });

    socket.current.on("floor-color-changed", (data) => {
      if (data.userId !== currentUser.id) {
        setFloorColor(data.color, false);
      }
    });

    socket.current.on("background-color-changed", (data) => {
      if (data.userId !== currentUser.id) {
        setBackgroundColor(data.color, false);
      }
    });

    socket.current.on("environment-preset-changed", (data) => {
      if (data.userId !== currentUser.id) {
        setEnvironmentPreset(data.preset, false);
      }
    });

    socket.current.on("wall-texture-changed", (data) => {
      if (data.userId !== currentUser.id) {
        setWallTexture(data.texture, false);
      }
    });

    socket.current.on("floor-texture-changed", (data) => {
      if (data.userId !== currentUser.id) {
        setFloorTexture(data.texture, false);
      }
    });

    socket.current.on("use-original-texture-changed", (data) => {
      if (data.userId !== currentUser.id) {
        setUseOriginalTexture(data.use, false);
      }
    });

    socket.current.on("use-original-wall-texture-changed", (data) => {
      if (data.userId !== currentUser.id) {
        setUseOriginalWallTexture(data.use, false);
      }
    });

    socket.current.on("wall-added", (data) => {
      if (data.userId !== currentUser.id) {
        // console.log("wall-added 데이터 수신:", data);
        addWallWithId(data.wallData, false); // 완성된 벽 객체 사용
      }
    });

    socket.current.on("wall-added-with-id", (data) => {
      if (data.userId !== currentUser.id) {
        // console.log("wall-added-with-id 데이터 수신:", data);
        addWallWithId(data.wallData, false);
      }
    });

    socket.current.on("wall-removed", (data) => {
      // console.log("wall-removed 데이터 수신", data);
      if (data.userId !== currentUser.id) {
        removeWall(data.wallId, false, false);
      }
    });

    socket.current.on("wall-updated", (data) => {
      if (data.userId !== currentUser.id) {
        updateWall(data.wallId, data.updates, false);
      }
    });
  };
  // Socket.IO 이벤트 전송
  const emitEvent = (event, data) => {
    if (socket.current && socket.current.connected) {
      socket.current.emit(event, data);
    }
  };

  // Socket.IO 연결 해제
  const disconnect = () => {
    isManualDisconnect.current = true;

    if (socket.current) {
      // 퇴장 알림 전송
      socket.current.emit("user-left", {
        userId: currentUser.id,
      });

      socket.current.disconnect();
      socket.current = null;
    }

    clearConnectedUsers();
    setConnectionStatus(false);
  };

  // DB 로드 완료 시 사용자 입장 처리
  useEffect(() => {
    if (socket.current && socket.current.connected) {
      socket.current.emit("user-join", {
        userId: currentUser.id,
        userData: {
          name: currentUser.name,
          color: currentUser.color,
        },
      });
    }
  }, [currentUser.id, currentUser.name, currentUser.color]);

  // 협업 모드 변경시 연결/해제 처리
  useEffect(() => {
    if (collaborationMode && roomId && currentUser.id) {
      isManualDisconnect.current = false;
      connectSocket();
    } else {
      // console.log("connectSocket 실행 조건 미충족:", {
      //   collaborationMode,
      //   roomId,
      //   currentUserId: currentUser.id,
      // });
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [collaborationMode, roomId, currentUser.id]);

  // Store에 브로드캐스트 함수들 등록
  useEffect(() => {
    if (collaborationMode) {
      setCollaborationCallbacks({
        broadcastModelAdd,
        broadcastModelAddWithId,
        broadcastModelRemove,
        broadcastModelMove,
        broadcastModelRotate,
        broadcastModelScale,
        broadcastModelSelect,
        broadcastModelDeselect,
        broadcastWallAdd,
        broadcastWallAddWithId,
        broadcastWallRemove,
        broadcastWallColorChange,
        broadcastFloorColorChange,
        broadcastBackgroundColorChange,
        broadcastEnvironmentPresetChange,
        broadcastWallTextureChange,
        broadcastFloorTextureChange,
        broadcastUseOriginalTextureChange,
        broadcastUseOriginalWallTextureChange,
      });
    } else {
      setCollaborationCallbacks({
        broadcastModelAdd: null,
        broadcastModelAddWithId: null,
        broadcastModelRemove: null,
        broadcastModelMove: null,
        broadcastModelRotate: null,
        broadcastModelScale: null,
        broadcastModelSelect: null,
        broadcastModelDeselect: null,
        broadcastWallAdd: null,
        broadcastWallAddWithId: null,
        broadcastWallRemove: null,
        broadcastWallColorChange: null,
        broadcastFloorColorChange: null,
        broadcastBackgroundColorChange: null,
        broadcastEnvironmentPresetChange: null,
        broadcastWallTextureChange: null,
        broadcastFloorTextureChange: null,
        broadcastUseOriginalTextureChange: null,
        broadcastUseOriginalWallTextureChange: null,
      });
    }
  }, [collaborationMode]);

  // 실시간 동기화를 위한 이벤트 전송 함수들
  const broadcastModelAdd = (modelData) => {
    emitEvent("model-added", {
      userId: currentUser.id,
      modelData,
    });
  };

  const broadcastModelAddWithId = (modelData) => {
    emitEvent("model-added-with-id", {
      userId: currentUser.id,
      modelData,
    });
  };

  const broadcastModelRemove = (modelId) => {
    emitEvent("model-removed", {
      userId: currentUser.id,
      modelId,
    });
  };

  const broadcastModelMove = (modelId, position) => {
    emitEvent("model-moved", {
      userId: currentUser.id,
      modelId,
      position,
    });
  };

  const broadcastModelRotate = (modelId, rotation) => {
    emitEvent("model-rotated", {
      userId: currentUser.id,
      modelId,
      rotation,
    });
  };

  const broadcastModelScale = (modelId, scale) => {
    emitEvent("model-scaled", {
      userId: currentUser.id,
      modelId,
      scale,
    });
  };

  const broadcastModelSelect = (modelId) => {
    emitEvent("model-select", {
      userId: currentUser.id,
      modelId,
      userData: {
        name: currentUser.name,
        color: currentUser.color,
      },
    });
  };

  const broadcastModelDeselect = (modelId) => {
    emitEvent("model-deselect", {
      userId: currentUser.id,
      modelId,
      userData: {
        name: currentUser.name,
        color: currentUser.color,
      },
    });
  };

  const broadcastCursorMove = (cursor) => {
    emitEvent("cursor-move", {
      userId: currentUser.id,
      cursor,
      userData: {
        name: currentUser.name,
        color: currentUser.color,
      },
    });
  };

  const broadcastWallColorChange = (color) => {
    emitEvent("wall-color-changed", {
      userId: currentUser.id,
      color,
    });
  };

  const broadcastFloorColorChange = (color) => {
    emitEvent("floor-color-changed", {
      userId: currentUser.id,
      color,
    });
  };

  const broadcastBackgroundColorChange = (color) => {
    emitEvent("background-color-changed", {
      userId: currentUser.id,
      color,
    });
  };

  const broadcastEnvironmentPresetChange = (preset) => {
    emitEvent("environment-preset-changed", {
      userId: currentUser.id,
      preset,
    });
  };

  const broadcastWallTextureChange = (texture) => {
    emitEvent("wall-texture-changed", {
      userId: currentUser.id,
      texture,
    });
  };

  const broadcastFloorTextureChange = (texture) => {
    emitEvent("floor-texture-changed", {
      userId: currentUser.id,
      texture,
    });
  };

  const broadcastUseOriginalTextureChange = (use) => {
    emitEvent("use-original-texture-changed", {
      userId: currentUser.id,
      use,
    });
  };

  const broadcastUseOriginalWallTextureChange = (use) => {
    emitEvent("use-original-wall-texture-changed", {
      userId: currentUser.id,
      use,
    });
  };

  const broadcastWallAdd = (wallData) => {
    // console.log("broadcast WallData", wallData);
    emitEvent("wall-added", {
      userId: currentUser.id,
      wallData,
    });
  };

  const broadcastWallAddWithId = (wallData) => {
    emitEvent("wall-added-with-id", {
      userId: currentUser.id,
      wallData,
    });
  };

  const broadcastWallRemove = (wallId) => {
    emitEvent("wall-removed", {
      userId: currentUser.id,
      wallId,
    });
  };

  return {
    // 연결 상태
    isConnected: socket.current?.connected || false,

    // 브로드캐스트 함수들
    broadcastModelAdd,
    broadcastModelAddWithId,
    broadcastModelRemove,
    broadcastModelMove,
    broadcastModelRotate,
    broadcastModelScale,
    broadcastModelSelect,
    broadcastModelDeselect,
    broadcastCursorMove,
    broadcastCollaborationEnd,
    broadcastWallAdd,
    broadcastWallAddWithId,
    broadcastWallRemove,
    broadcastWallColorChange,
    broadcastFloorColorChange,
    broadcastBackgroundColorChange,
    broadcastEnvironmentPresetChange,
    broadcastWallTextureChange,
    broadcastFloorTextureChange,
    broadcastUseOriginalTextureChange,
    broadcastUseOriginalWallTextureChange,

    // 연결 관리
    disconnect,

    // 상태
    showCollaborationEndNotice,
    setShowCollaborationEndNotice,
  };
}
