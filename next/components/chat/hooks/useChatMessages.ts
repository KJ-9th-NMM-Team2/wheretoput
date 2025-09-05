// 채팅 메시지 관리 훅
// 메시지 송수신, 히스토리 로드, 실시간 메시지 처리를 담당

import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/lib/client/api";
import { connectSocket, getSocket } from "@/lib/client/socket";
import { Message } from "../types/chat-types";
import { dayKey } from "../utils/chat-utils";

const SOCKET_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const useChatMessages = (
  open: boolean,
  selectedChatId: string | null,
  token: string | null,
  currentUserId: string | null,
  onChatRoomUpdate: (roomId: string, updates: any) => void
) => {
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, Message[]>>({});
  const [text, setText] = useState("");

  const selectedMessages: Message[] = selectedChatId
    ? messagesByRoom[selectedChatId] ?? []
    : [];

  const groupedByDay = useMemo(() => {
    const acc: Record<string, Message[]> = {};
    for (const m of selectedMessages) {
      const k = dayKey(m.createdAt);
      (acc[k] ||= []).push(m);
    }
    return acc;
  }, [selectedMessages]);

  // 방 선택 시 join + 히스토리 로드
  useEffect(() => {
    if (!open || !selectedChatId || !token) return;
    const s = connectSocket(token);
    console.log("🚪 FRONTEND JOIN:", selectedChatId);
    s.emit("join", { roomId: selectedChatId });

    let cancelled = false;

    (async () => {
      const { data } = await api.get(
        `${SOCKET_API_URL}/rooms/${selectedChatId}/messages`,
        {
          params: { limit: 50 },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (cancelled) return;
      const history: Message[] = (data?.messages ?? data ?? []).map(
        (m: any) => ({
          id: m.id ?? String(m.message_id),
          roomId: m.roomId ?? String(m.room_id ?? selectedChatId),
          senderId: m.senderId ?? String(m.user_id),
          senderName: m.senderName ?? "이름 없음",
          senderImage: m.senderImage ?? "",
          content: m.content,
          createdAt: m.createdAt ?? m.created_at,
          status: "read",
        })
      );
      console.log(
        "Messages with avatars:",
        history.map((h) => ({
          senderName: h.senderName,
          senderImage: h.senderImage,
        }))
      );
      setMessagesByRoom((prev) => ({ ...prev, [selectedChatId]: history }));

      // 읽음 처리
      s.emit("read", { roomId: selectedChatId });
      onChatRoomUpdate(selectedChatId, {
        last_read_at: new Date().toISOString()
      });
    })();

    return () => {
      cancelled = true;
      s.emit("leave", { roomId: selectedChatId });
    };
  }, [open, selectedChatId, token, onChatRoomUpdate]);

  // 실시간 수신 + ACK + 읽음 이벤트
  useEffect(() => {
    if (!open) return;
    const s = getSocket();
    if (!s) return;

    const onMessage = (m: any) => {
      const msg: Message = {
        id: m.id ?? String(m.message_id),
        roomId: m.roomId ?? String(m.room_id),
        senderId: m.senderId ?? String(m.user_id),
        senderName: m.sender?.name ?? m.user?.name,
        senderImage: m.sender?.image ?? m.user?.image,
        content: m.content,
        createdAt: m.createdAt ?? m.created_at,
        status: "sent",
      };

      setMessagesByRoom((prev) => {
        const existingMessages = prev[msg.roomId] ?? [];
        // 중복 메시지 체크 (같은 ID가 이미 있으면 추가하지 않음)
        const isDuplicate = existingMessages.some(
          (existingMsg) => existingMsg.id === msg.id
        );
        if (isDuplicate) {
          return prev;
        }
        return {
          ...prev,
          [msg.roomId]: [...existingMessages, msg],
        };
      });

      // 현재 열린 채팅방의 메시지이고 내가 보낸 메시지가 아니라면 자동으로 읽음 처리
      if (msg.roomId === selectedChatId && msg.senderId !== currentUserId) {
        const s = getSocket();
        if (s) {
          s.emit("read", { roomId: msg.roomId });
        }
      }

      // 채팅방 목록 업데이트
      onChatRoomUpdate(msg.roomId, {
        lastMessage: msg.content,
        lastMessageAt: msg.createdAt,
        // 내가 보낸 메시지이거나 현재 열린 채팅방의 메시지라면 읽음 처리
        last_read_at:
          msg.senderId === currentUserId || msg.roomId === selectedChatId
            ? msg.createdAt
            : undefined,
        searchIndex: (msg.content ?? "").toLocaleLowerCase("ko-KR"),
      });
    };

    const onAck = (ack: {
      tempId: string;
      realId: string;
      createdAt?: string;
    }) => {
      if (!selectedChatId) return;
      setMessagesByRoom((prev) => {
        const arr = prev[selectedChatId] ?? [];
        const next = arr.map((m) =>
          m.id === ack.tempId
            ? {
                ...m,
                id: ack.realId,
                status: "sent",
                createdAt: ack.createdAt ?? m.createdAt,
                tempId: undefined,
              }
            : m
        );
        return { ...prev, [selectedChatId]: next };
      });
    };

    const onRead = (evt: {
      roomId: string;
      userId?: string;
      readAt?: string;
    }) => {
      // 메시지 읽음 상태 업데이트 (현재 열린 방만)
      if (evt.roomId === selectedChatId) {
        setMessagesByRoom((prev) => {
          const arr = prev[evt.roomId] ?? [];
          const next = arr.map((m) =>
            m.senderId === currentUserId && m.status !== "read"
              ? { ...m, status: "read" }
              : m
          );
          return { ...prev, [evt.roomId]: next };
        });
      }

      // 방 목록의 last_read_at 업데이트 (모든 방)
      if (evt.userId === currentUserId && evt.readAt) {
        onChatRoomUpdate(evt.roomId, {
          last_read_at: evt.readAt
        });
      }
    };

    s.on("message", onMessage);
    s.on("message:ack", onAck);
    s.on("read:updated", onRead);

    return () => {
      s.off("message", onMessage);
      s.off("message:ack", onAck);
      s.off("read:updated", onRead);
    };
  }, [open, currentUserId, selectedChatId, onChatRoomUpdate]);

  // 메시지 전송
  const onSendMessage = useCallback(
    (roomId: string, content: string) => {
      if (!token) return;
      const now = new Date().toISOString();
      const tempId = `tmp-${Math.random().toString(36).slice(2)}`;
      const tempMsg: Message = {
        id: tempId,
        tempId,
        roomId,
        senderId: currentUserId,
        content,
        createdAt: now,
        status: "sending",
      };

      setMessagesByRoom((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] ?? []), tempMsg],
      }));

      onChatRoomUpdate(roomId, {
        lastMessage: content,
        lastMessageAt: now,
        last_read_at: now,
        searchIndex: (content ?? "").toLocaleLowerCase("ko-KR"),
      });

      const s = getSocket() ?? connectSocket(token);
      console.log("🔵 WEBSOCKET SEND:", { roomId, content, tempId });
      console.log("🔵 SOCKET STATE:", s.connected);
      s.emit("send", { roomId, content, tempId });
    },
    [currentUserId, token, onChatRoomUpdate]
  );

  // 메시지 전송 래퍼
  const send = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !selectedChatId) return;
    onSendMessage(selectedChatId, trimmed);
    setText("");
  }, [text, selectedChatId, onSendMessage]);

  // 키보드 이벤트 핸들러
  const onEditorKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return {
    messagesByRoom,
    selectedMessages,
    groupedByDay,
    text,
    setText,
    onSendMessage,
    send,
    onEditorKeyDown,
  };
};