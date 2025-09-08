import { io, Socket } from "socket.io-client";

// 네임스페이스별로 소켓 관리
const sockets = new Map<string, Socket>();

export function connectSocket(jwt: string, namespace: string = "/") {
  const serverUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const fullUrl = serverUrl + namespace;

  // 이미 해당 네임스페이스에 연결된 소켓이 있으면 재사용
  if (sockets.has(namespace)) {
    const existingSocket = sockets.get(namespace)!;
    if (existingSocket.connected) {
      console.log("🔄 REUSING EXISTING SOCKET:", fullUrl);
      return existingSocket;
    } else {
      // 연결이 끊어진 소켓은 제거하고 새로 생성
      sockets.delete(namespace);
    }
  }

  // 새 소켓 생성
  const socket = io(fullUrl, {
    transports: ["polling", "websocket"],
    auth: { token: jwt },
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
    socket.disconnect();
    sockets.delete(namespace);
    console.log("🔌 SOCKET DISCONNECTED:", namespace);
  }
}

export function disconnectAllSockets() {
  sockets.forEach((socket, namespace) => {
    socket.disconnect();
    console.log("🔌 SOCKET DISCONNECTED:", namespace);
  });
  sockets.clear();
}
