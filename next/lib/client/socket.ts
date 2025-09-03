import { io, Socket } from "socket.io-client";
let socket: Socket | null = null;

export function connectSocket(jwt: string) {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001", {
            transports: ["websocket"],
            auth: { token: jwt },
        });
    } else {
        socket.auth = { token: jwt };
        socket.disconnect().connect();
    }
    return socket;
}
export function getSocket() { return socket; }
