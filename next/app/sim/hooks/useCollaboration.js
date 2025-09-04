import { useEffect, useRef } from "react";
import { useStore } from "@/app/sim/store/useStore.js";

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
  console.log("협업 모드 실행 중!, roomId:", roomId);
  const ws = useRef(null);
  const reconnectTimer = useRef(null);
  const isManualDisconnect = useRef(false);

  const {
    collaborationMode,
    currentUser,
    setConnectionStatus,
    updateConnectedUser,
    removeConnectedUser,
    clearConnectedUsers,
    updateModelPosition,
    updateModelRotation,
    updateModelScale,
    selectModel,
  } = useStore();

  // WebSocket 연결 초기화
  const connectWebSocket = () => {
    if (!roomId || !collaborationMode) return;

    try {
      // 실제 구현시 환경변수에서 WebSocket 서버 주소 가져오기
      const wsUrl = `ws://localhost:8080/collaboration/${roomId}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("🔗 협업 모드 연결됨");
        setConnectionStatus(true);

        // 사용자 정보 전송 (입장 알림)
        sendMessage({
          type: "USER_JOIN",
          userId: currentUser.id,
          userData: {
            name: currentUser.name,
            color: currentUser.color,
          },
        });
      };

      ws.current.onmessage = (event) => {
        handleWebSocketMessage(JSON.parse(event.data));
      };

      ws.current.onclose = () => {
        console.log("🔌 협업 연결 끊김");
        setConnectionStatus(false);

        // 수동으로 끊지 않은 경우 자동 재연결 시도
        if (!isManualDisconnect.current && collaborationMode) {
          scheduleReconnect();
        }
      };

      ws.current.onerror = (error) => {
        console.error("❌ 협업 연결 오류:", error);
      };
    } catch (error) {
      console.error("WebSocket 연결 실패:", error);
    }
  };

  // WebSocket 메시지 처리
  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case "USER_JOIN":
        // 새 사용자 입장
        updateConnectedUser(message.userId, message.userData);
        console.log(`👤 ${message.userData.name}님이 입장했습니다`);
        break;

      case "USER_LEAVE":
        // 사용자 퇴장
        removeConnectedUser(message.userId);
        console.log(`👋 사용자가 퇴장했습니다`);
        break;

      case "MODEL_MOVE":
        // 모델 위치 변경 동기화
        if (message.userId !== currentUser.id) {
          updateModelPosition(message.modelId, message.position);
        }
        break;

      case "MODEL_ROTATE":
        // 모델 회전 동기화
        if (message.userId !== currentUser.id) {
          updateModelRotation(message.modelId, message.rotation);
        }
        break;

      case "MODEL_SCALE":
        // 모델 크기 변경 동기화
        if (message.userId !== currentUser.id) {
          updateModelScale(message.modelId, message.scale);
        }
        break;

      case "MODEL_SELECT":
        // 다른 사용자의 모델 선택 상태 업데이트
        if (message.userId !== currentUser.id) {
          updateConnectedUser(message.userId, {
            ...message.userData,
            selectedModel: message.modelId,
          });
        }
        break;

      case "CURSOR_MOVE":
        // 커서 위치 업데이트
        if (message.userId !== currentUser.id) {
          updateConnectedUser(message.userId, {
            ...message.userData,
            cursor: message.cursor,
          });
        }
        break;

      default:
        console.warn("알 수 없는 메시지 타입:", message.type);
    }
  };

  // WebSocket 메시지 전송
  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  // 자동 재연결 스케줄링
  const scheduleReconnect = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }

    reconnectTimer.current = setTimeout(() => {
      console.log("🔄 협업 모드 재연결 시도...");
      connectWebSocket();
    }, 3000); // 3초 후 재연결
  };

  // WebSocket 연결 해제
  const disconnect = () => {
    isManualDisconnect.current = true;

    if (ws.current) {
      // 퇴장 알림 전송
      sendMessage({
        type: "USER_LEAVE",
        userId: currentUser.id,
      });

      ws.current.close();
      ws.current = null;
    }

    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    clearConnectedUsers();
    setConnectionStatus(false);
  };

  // 협업 모드 변경시 연결/해제 처리
  useEffect(() => {
    if (collaborationMode && currentUser.id) {
      isManualDisconnect.current = false;
      connectWebSocket();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [collaborationMode, roomId, currentUser.id]);

  // 실시간 동기화를 위한 이벤트 전송 함수들
  const broadcastModelMove = (modelId, position) => {
    sendMessage({
      type: "MODEL_MOVE",
      userId: currentUser.id,
      modelId,
      position,
    });
  };

  const broadcastModelRotate = (modelId, rotation) => {
    sendMessage({
      type: "MODEL_ROTATE",
      userId: currentUser.id,
      modelId,
      rotation,
    });
  };

  const broadcastModelScale = (modelId, scale) => {
    sendMessage({
      type: "MODEL_SCALE",
      userId: currentUser.id,
      modelId,
      scale,
    });
  };

  const broadcastModelSelect = (modelId) => {
    sendMessage({
      type: "MODEL_SELECT",
      userId: currentUser.id,
      modelId,
      userData: {
        name: currentUser.name,
        color: currentUser.color,
      },
    });
  };

  const broadcastCursorMove = (cursor) => {
    sendMessage({
      type: "CURSOR_MOVE",
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
    isConnected: ws.current?.readyState === WebSocket.OPEN,

    // 브로드캐스트 함수들
    broadcastModelMove,
    broadcastModelRotate,
    broadcastModelScale,
    broadcastModelSelect,
    broadcastCursorMove,

    // 연결 관리
    disconnect,
  };
}
