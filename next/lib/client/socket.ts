import { io, Socket } from "socket.io-client";

// 네임스페이스별로 소켓 관리
const sockets = new Map<string, Socket>();
const connectionStates = new Map<string, { connecting: boolean; lastConnectTime: number }>();

export function connectSocket(jwt: string, namespace: string = "/") {
  const serverUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const fullUrl = serverUrl + namespace;

  
  // 중복 연결 시도 방지
  const state = connectionStates.get(namespace);
  if (state?.connecting && (Date.now() - state.lastConnectTime) < 3000) {
    console.log('🔄 CONNECTION ALREADY IN PROGRESS:', fullUrl);
    return sockets.get(namespace) || createNewSocket(jwt, namespace, fullUrl);
  }

  // 이미 해당 네임스페이스에 연결된 소켓이 있으면 재사용
  if (sockets.has(namespace)) {
    const existingSocket = sockets.get(namespace)!;
    if (existingSocket.connected) {
      console.log("🔄 REUSING EXISTING SOCKET:", fullUrl);
      return existingSocket;
    } else {
      // 연결이 끊어진 소켓은 제거하고 새로 생성
      console.log('🔄 CLEANING UP DISCONNECTED SOCKET:', fullUrl);
      existingSocket.removeAllListeners();
      existingSocket.disconnect();
      sockets.delete(namespace);
    }
  }

  return createNewSocket(jwt, namespace, fullUrl);
}

function createNewSocket(jwt: string, namespace: string, fullUrl: string): Socket {
  // 연결 상태 업데이트
  connectionStates.set(namespace, { connecting: true, lastConnectTime: Date.now() });

  // 새 소켓 생성 (향상된 설정)
  const socket = io(fullUrl, {
    transports: ["websocket", "polling"], // websocket 우선으로 변경
    auth: { token: jwt },
    timeout: 10000, // 연결 타임아웃 10초
    forceNew: true, // 새 연결 강제
    reconnection: true, // 자동 재연결 활성화
    reconnectionAttempts: 3, // 재연결 시도 횟수 제한
    reconnectionDelay: 1000, // 재연결 지연시간
    reconnectionDelayMax: 3000, // 최대 재연결 지연시간
  });

  // 연결 성공 시 상태 업데이트
  socket.on('connect', () => {
    console.log('🟢 SOCKET CONNECTED:', fullUrl, socket.id);
    connectionStates.set(namespace, { connecting: false, lastConnectTime: Date.now() });
  });

  // 연결 실패 시 처리
  socket.on('connect_error', (error) => {
    console.error('🔴 SOCKET CONNECTION ERROR:', fullUrl, error.message);
    connectionStates.set(namespace, { connecting: false, lastConnectTime: Date.now() });
  });

  // 재연결 시도 시
  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('🔄 SOCKET RECONNECT ATTEMPT:', attemptNumber, fullUrl);
  });

  // 재연결 성공 시
  socket.on('reconnect', (attemptNumber) => {
    console.log('🟢 SOCKET RECONNECTED:', fullUrl, 'attempts:', attemptNumber);
  });

  // 재연결 실패 시 (모든 시도 소진)
  socket.on('reconnect_failed', () => {
    console.error('🔴 SOCKET RECONNECT FAILED:', fullUrl);
    // 소켓을 맵에서 제거하여 다음 요청시 새로 생성되도록 함
    sockets.delete(namespace);
    connectionStates.delete(namespace);
  });

  // 연결 해제 시
  socket.on('disconnect', (reason) => {
    console.log('🔴 SOCKET DISCONNECTED:', fullUrl, reason);
    if (reason === 'io server disconnect' || reason === 'io client disconnect') {
      // 서버나 클라이언트에서 의도적으로 연결을 끊은 경우 재연결하지 않음
      sockets.delete(namespace);
      connectionStates.delete(namespace);
    }
  });

  sockets.set(namespace, socket);
  console.log("🔌 NEW SOCKET CONNECTING TO:", fullUrl);

  return socket;
}

export function getSocket(namespace: string = "/") {
  return sockets.get(namespace) || null;
}

export function disconnectSocket(namespace: string) {
  const socket = sockets.get(namespace);
  if (socket) {
    console.log('🔌 DISCONNECTING SOCKET:', namespace);
    socket.removeAllListeners(); // 모든 이벤트 리스너 제거
    socket.disconnect();
    sockets.delete(namespace);

    connectionStates.delete(namespace);
    console.log('✅ SOCKET DISCONNECTED AND CLEANED:', namespace);

    console.log("🔌 SOCKET DISCONNECTED:", namespace);

  }
}

export function disconnectAllSockets() {
  console.log('🔌 DISCONNECTING ALL SOCKETS');
  sockets.forEach((socket, namespace) => {
    socket.removeAllListeners(); // 모든 이벤트 리스너 제거
    socket.disconnect();

    console.log('✅ SOCKET DISCONNECTED:', namespace);

    console.log("🔌 SOCKET DISCONNECTED:", namespace);

  });
  sockets.clear();
  connectionStates.clear();
  console.log('✅ ALL SOCKETS DISCONNECTED AND CLEANED');
}

// 연결 상태 확인 함수 추가
export function getSocketStatus(namespace: string = '/') {
  const socket = sockets.get(namespace);
  const state = connectionStates.get(namespace);
  
  return {
    exists: !!socket,
    connected: socket?.connected ?? false,
    connecting: state?.connecting ?? false,
    id: socket?.id,
    lastConnectTime: state?.lastConnectTime
  };
}
