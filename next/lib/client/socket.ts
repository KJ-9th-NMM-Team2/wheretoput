import { io, Socket } from "socket.io-client";
let socket: Socket | null = null;

export function connectSocket(jwt: string) {
  if (!socket) {
    socket = io(
      process.env.NEXT_PUBLIC_API_URL ??
        process.env.NEXT_PUBLIC_API_URL ??
        "http://localhost:3001",
      {
        transports: ["polling", "websocket"], // polling 우선으로 변경
        auth: { token: jwt },
      }
    );
    console.log('🔌 SOCKET CONNECTING TO:', process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");
  } else {
    socket.auth = { token: jwt };
    socket.disconnect().connect();
  }
  return socket;
}
export function getSocket() {
  return socket;
}
