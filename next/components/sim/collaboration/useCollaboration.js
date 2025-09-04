import { useEffect, useRef } from "react";
import { useStore } from "@/components/sim/useStore.js";
import { io } from "socket.io-client";
import { connectSocket as startSocket } from "@/lib/client/socket";

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
  } = useStore();

  // Socket.IO 연결 초기화
  const connectSocket = async () => {
    console.log("소켓접속 시도중");
    if (!roomId || !collaborationMode) return;

    try {
      const res = await fetch("/api/chat/token", { cache: "no-store" });
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

        // 사용자 정보 전송 (입장 알림)
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

      socket.current.on("disconnect", () => {
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

    socket.current.on("user-left", (data) => {
      removeConnectedUser(data.userId);
      console.log(`👋 $${data.userData.name}님이 퇴장했습니다`);
    });

    socket.current.on("request-user-list", (data) => {
      // 기존 사용자가 새로 입장한 사용자에게 자신의 정보를 전송
      socket.current.emit("user-info-response", {
        userId: currentUser.id,
        userData: { name: currentUser.name, color: currentUser.color },
        targetSocketId: data.newUserId,
      });
    });

    // 새로 입장한 사용자가 기존 사용자들의 정보를 받음
    socket.current.on("user-info-response", (data) => {
      if (data.userId !== currentUser.id) {
        updateConnectedUser(data.userId, data.userData);
        console.log(
          `📋 기존 사용자 확인: ${data.userData.name}님이 이미 접속해 있습니다`
        );
      }
    });

    socket.current.on("model-added", (data) => {
      if (data.userId !== currentUser.id) {
        addModel(data.modelData);
      }
    });

    socket.current.on("model-added-with-id", (data) => {
      if (data.userId !== currentUser.id) {
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

    // 후순위
    socket.current.on("model-selected", (data) => {
      if (data.userId !== currentUser.id) {
        updateConnectedUser(data.userId, {
          ...data.userData,
          selectedModel: data.modelId,
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

  // 협업 모드 변경시 연결/해제 처리
  useEffect(() => {
    console.log("useEffect 트리거됨:", {
      collaborationMode,
      roomId,
      currentUserId: currentUser.id,
    });
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
      });
    } else {
      setCollaborationCallbacks({
        broadcastModelAdd: null,
        broadcastModelAddWithId: null,
        broadcastModelRemove: null,
        broadcastModelMove: null,
        broadcastModelRotate: null,
        broadcastModelScale: null,
      });
    }
  }, [collaborationMode]);

  // 실시간 동기화를 위한 이벤트 전송 함수들
  const broadcastModelAdd = (modelData) => {
    emitEvent("model-added-with-id", {
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
    emitEvent("model-move", {
      userId: currentUser.id,
      modelId,
      position,
    });
  };

  const broadcastModelRotate = (modelId, rotation) => {
    emitEvent("model-rotate", {
      userId: currentUser.id,
      modelId,
      rotation,
    });
  };

  const broadcastModelScale = (modelId, scale) => {
    emitEvent("model-scale", {
      userId: currentUser.id,
      modelId,
      scale,
    });
  };

  // 일단 나중에 합시다
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
    broadcastCursorMove,

    // 연결 관리
    disconnect,
  };
}
