import { useEffect, useRef } from "react";
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
  } = useStore();

  const router = useRouter();

  // 협업 종료 브로드캐스트 함수
  const broadcastCollaborationEnd = () => {
    if (socket.current && socket.current.connected) {
      console.log("🔚 협업 종료 알림을 다른 사용자들에게 전송");
      socket.current.emit("collaboration-ended", {
        ownerId: currentUser.id,
        roomId,
        message: "방 소유자가 협업 모드를 종료했습니다",
      });
    }
  };

  // Socket.IO 연결 초기화
  const connectSocket = async () => {
    console.log("소켓접속 시도중");
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
        console.log("🔗 협업 모드 연결됨");
        setConnectionStatus(true);

        // 방 입장
        socket.current.emit("join-room", roomId);

        // 협업 모드에서는 바로 사용자 입장 처리
        console.log("협업 모드 연결 완료, 즉시 사용자 입장 처리");
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
        console.log("🔌 협업 연결 끊김");
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
      console.log(`👤 ${data.userData.name}님이 입장했습니다`);
    });

    socket.current.on("user-left", async (data) => {
      console.log("🔴 user-left 이벤트 수신:", data);

      if (data.userId === currentUser.id && !isManualDisconnect.current) {
        // 협업 종료로 인한 퇴장인지 일반 퇴장인지 구분
        if (data.reason === "collaboration-ended") {
          alert("방 소유자가 협업 모드를 종료하여 방에서 나갔습니다.");
          router.push(roomId ? `/sim/${roomId}` : `/`);
        } else if (data.reason === "time-out") {
          alert("비활성 상태로 인해 방에서 퇴장되었습니다.");
          router.push(roomId ? `/sim/${roomId}` : `/`);
        } else if (data.reason === "duplicate-connection") {
          alert(
            "동일한 계정으로 다른 탭에서 접속하여 현재 연결이 해제되었습니다."
          );
          router.push(roomId ? `/sim/${roomId}` : `/`);
        }
      } else {
        // 사용자 정보 제거
        removeConnectedUser(data.userId);
        console.log(
          `👋 ${data.userData?.name || data.userId}님이 퇴장했습니다`
        );
        console.log(
          "퇴장 후 connectedUsers:",
          useStore.getState().connectedUsers
        );
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

      // Redis의 모든 모델을 새로 추가
      if (data.models && data.models.length > 0) {
        
        data.models.forEach((redisModel, index) => {

          try {
            addModelWithId(redisModel, false);
            console.log(`✅ 모델 ${redisModel.id} 추가 성공`);
          } catch (error) {
            console.error(`❌ 모델 ${redisModel.id} 추가 실패:`, error);
          }
        });
      } else {
        console.log("📭 Redis에 저장된 모델이 없음");
      }

      // 연결된 사용자 정보 업데이트
      if (data.connectedUsers) {
        data.connectedUsers.forEach(([userId, userData]) => {
          if (userId !== currentUser.id) {
            console.log(`기존 사용자 정보 업데이트: ${userData.name}`);
            updateConnectedUser(userId, userData);
          }
        });
      }
    });

    // 새로 입장한 사용자가 기존 사용자들의 정보를 받음
    socket.current.on("user-info-response", (data) => {
      if (data.userId !== currentUser.id) {
        updateConnectedUser(data.userId, data.userData);
        console.log(
          `📋 기존 사용자 확인: ${data.userData.name}님이 이미 접속해 있습니다`
        );
      } else {
        console.log(`🔄 자신의 정보는 무시: ${data.userData.name}`);
      }
    });

    socket.current.on("model-added", (data) => {
      if (data.userId !== currentUser.id) {
        console.log("➕ model-added 이벤트 수신:", data);
        console.log("modelData 상세 정보:", {
          id: data.modelData?.id,
          name: data.modelData?.name,
          url: data.modelData?.url,
          furniture_id: data.modelData?.furniture_id,
          position: data.modelData?.position,
          rotation: data.modelData?.rotation,
          scale: data.modelData?.scale,
        });
        addModel(data.modelData, false);
      }
    });

    socket.current.on("model-added-with-id", (data) => {
      if (data.userId !== currentUser.id) {
        console.log("➕ model-added-with-id 이벤트 수신:", data);
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
      console.log("🔥 model-select 이벤트 수신:", data);
      if (data.userId !== currentUser.id) {
        updateConnectedUser(data.userId, {
          selectedModelId: data.modelId,
          showTooltip: true,
          tooltipModelId: data.modelId,
        });
      }
    });

    socket.current.on("model-deselect", (data) => {
      console.log("🔥 model-deselect 이벤트 수신:", data);
      if (data.userId !== currentUser.id) {
        updateConnectedUser(data.userId, {
          selectedModelId: null,
          showTooltip: false,
          tooltipModelId: null,
        });
      }
    });

    // 후순위
    socket.current.on("cursor-moved", (data) => {
      if (data.userId !== currentUser.id) {
        updateConnectedUser(data.userId, {
          ...data.userData,
          cursor: data.cursor,
        });
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
      console.log("connectSocket 실행 조건 미충족:", {
        collaborationMode,
        roomId,
        currentUserId: currentUser.id,
      });
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

    // 연결 관리
    disconnect,
  };
}
