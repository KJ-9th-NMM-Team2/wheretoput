"use client";
import { useEffect, useState } from "react";
import { connectSocket, getSocket } from "@/lib/client/socket";
import { setAuthToken } from "@/lib/client/api";

type Msg = {
    id: string;
    roomId: string;
    senderId: string;
    content: string;
    createdAt: string;
    status: "sent" | "pending";
};

export default function ChatRoomClient({ roomId, jwt }: { roomId: string; jwt: string }) {
    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState("");

    useEffect(() => {
        // REST 인증 헤더 주입
        setAuthToken(jwt);

        // 소켓 연결 + 방 입장
        const s = connectSocket(jwt);
        s.emit("join", { roomId });

        s.on("message", (msg: Msg) => {
            setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
        });

        return () => {
            s.off("message");
            s.disconnect();
        };
    }, [roomId, jwt]);

    const send = () => {
        const s = getSocket();
        const content = input.trim();
        if (!s || !content) return;

        const temp: Msg = {
            id: `temp-${Date.now()}`,
            roomId, senderId: "me", content,
            createdAt: new Date().toISOString(),
            status: "pending",
        };
        setMessages(prev => [...prev, temp]);
        setInput("");

        s.emit("send", { roomId, content });
    };

    return (
        <div className="space-y-3">
            <ul className="border rounded p-3 h-80 overflow-auto">
                {messages
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map(m => (
                        <li key={m.id} className="py-1">
                            <span className="text-xs text-gray-500 mr-2">
                                {new Date(m.createdAt).toLocaleTimeString()}
                            </span>
                            <span className="font-semibold mr-2">{m.senderId}</span>
                            <span>{m.content}</span>
                            {m.id.startsWith("temp-") && (
                                <span className="ml-2 text-xs text-orange-500">(전송중)</span>
                            )}
                        </li>
                    ))}
            </ul>

            <div className="flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="메시지를 입력하세요"
                    className="flex-1 border rounded px-3 py-2"
                />
                <button onClick={send} className="px-4 py-2 border rounded">전송</button>
            </div>
        </div>
    );
}
