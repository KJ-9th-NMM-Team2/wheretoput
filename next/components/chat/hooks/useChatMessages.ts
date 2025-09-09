// 채팅 메시지 관리 훅
// 메시지 송수신, 히스토리 로드, 실시간 메시지 처리를 담당

import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/lib/client/api";
import { connectSocket, getSocket } from "@/lib/client/socket";
import { Socket } from "socket.io-client";
import { Message, ChatListItem } from "../types/chat-types";
import { dayKey } from "../utils/chat-utils";

const SOCKET_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const useChatMessages = (
  open: boolean,
  selectedChatId: string | null,
  token: string | null,
  currentUserId: string | null,
  onChatRoomUpdate: (roomId: string, updates: Partial<ChatListItem>) => void
) => {
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, Message[]>>({});
  const [text, setText] = useState("");
  const [chatLastMessage, setChatLastMessage] = useState("");

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

  // 방 선택 시 join + 히스토리 로드 (순차적 처리로 타이밍 문제 해결)
  useEffect(() => {
    if (!open || !selectedChatId || !token) return;
    
    let cancelled = false;
    let currentSocket: Socket | null = null;

    const joinRoom = async () => {
      try {
        currentSocket = connectSocket(token);
        
        // 소켓 연결 대기 (연결이 불안정할 경우 대비)
        await new Promise(resolve => {
          if (currentSocket.connected) {
            resolve(null);
          } else {
            currentSocket.once('connect', resolve);
            // 타임아웃 설정 (3초 후 강제 진행)
            setTimeout(resolve, 3000);
          }
        });

        if (cancelled) return;

        console.log("🚪 FRONTEND JOIN:", selectedChatId);
        currentSocket.emit("join", { roomId: selectedChatId });

        // join 명령 처리 대기 (서버 처리 시간 확보)
        await new Promise(resolve => setTimeout(resolve, 100));

        if (cancelled) return;

        // 히스토리 로드
        const { data } = await api.get(
          `${SOCKET_API_URL}/rooms/${selectedChatId}/messages`,
          {
            params: { limit: 50 },
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (cancelled) return;
        
        const history: Message[] = (data?.messages ?? data ?? []).map(
          (m: any) => {
            // S3 키 패턴 감지로 이미지 메시지 판단 (임시 해결책)
            const isImageMessage = m.content && m.content.startsWith('chat/') &&
              /\.(jpg|jpeg|png|gif|webp)$/i.test(m.content);

            return {
              id: m.id ?? String(m.message_id),
              roomId: m.roomId ?? String(m.room_id ?? selectedChatId),
              senderId: m.senderId ?? String(m.user_id),
              senderName: m.senderName ?? "이름 없음",
              senderImage: m.senderImage ?? "",
              content: m.content,
              message_type: m.message_type ?? (isImageMessage ? "image" : "text"),
              createdAt: m.createdAt ?? m.created_at,
              status: "read",
            };
          }
        );
        
        console.log(
          "Messages with avatars:",
          history.map((h) => ({
            senderName: h.senderName,
            senderImage: h.senderImage,
          }))
        );
        
        setMessagesByRoom((prev) => ({ ...prev, [selectedChatId]: history }));
        
        // 히스토리 로드 후 읽음 처리 (받은 메시지들만 읽음으로 표시)
        const receivedMessages = history.filter(msg => msg.senderId !== currentUserId);
        if (receivedMessages.length > 0 && !cancelled) {
          currentSocket.emit("read", { roomId: selectedChatId });
          onChatRoomUpdate(selectedChatId, {
            last_read_at: new Date().toISOString()
          });
        }

      } catch (error) {
        console.error("메시지 히스토리 로드 실패:", error);
        // 오류 발생시 빈 배열로 설정하여 앱이 크래시되지 않도록 처리
        if (!cancelled) {
          setMessagesByRoom((prev) => ({ ...prev, [selectedChatId]: [] }));
        }
      }
    };

    // 비동기 함수 실행
    joinRoom();

    return () => {
      cancelled = true;
      // leave 이벤트 전송 (순차 처리)
      if (currentSocket && currentSocket.connected) {
        console.log("🚪 FRONTEND LEAVE:", selectedChatId);
        currentSocket.emit("leave", { roomId: selectedChatId });
      }
    };
  }, [open, selectedChatId, token, onChatRoomUpdate]);

  // 실시간 수신 + ACK + 읽음 이벤트
  useEffect(() => {
    if (!open) return;
    const s = getSocket();
    if (!s) return;

    const onMessage = (m: any) => {
      console.log('🔍 [DEBUG] 실시간 메시지 받은 데이터:', m);
      console.log('🔍 [DEBUG] senderName:', m.senderName);
      console.log('🔍 [DEBUG] senderImage:', m.senderImage);
      
      // S3 키 패턴 감지로 이미지 메시지 판단 (임시 해결책)
      const isImageMessage = m.content && m.content.startsWith('chat/') &&
        /\.(jpg|jpeg|png|gif|webp)$/i.test(m.content);

      const msg: Message = {
        id: m.id ?? String(m.message_id),
        roomId: m.roomId ?? String(m.room_id),
        senderId: m.senderId ?? String(m.user_id),
        senderName: m.senderName ?? m.sender?.name ?? m.user?.name,
        senderImage: m.senderImage ?? m.sender?.image ?? m.user?.image,
        content: m.content,
        message_type: m.message_type ?? (isImageMessage ? "image" : "text"),
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
      const displayMessage = msg.message_type === "image" ||
        (msg.content && msg.content.startsWith('chat/') && /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.content))
        ? "사진"
        : msg.content;

      onChatRoomUpdate(msg.roomId, {
        lastMessage: displayMessage,
        lastMessageAt: msg.createdAt,
        lastMessageSenderId: msg.senderId, // 마지막 메시지 발송자 ID 업데이트
        // 현재 열린 채팅방의 메시지이고 내가 받은 메시지만 읽음 처리
        last_read_at:
          msg.roomId === selectedChatId && msg.senderId !== currentUserId
            ? msg.createdAt
            : undefined,
        searchIndex: (displayMessage ?? "").toLocaleLowerCase("ko-KR"),
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

    // 서버 이벤트 처리 (연결 상태 확인)
    const onJoined = (data: { roomId: string }) => {
      console.log('🟢 JOINED ROOM:', data.roomId);
    };

    const onLeft = (data: { roomId: string }) => {
      console.log('🔴 LEFT ROOM:', data.roomId);
    };

    const onSystem = (data: { type: string; roomId: string; userId?: string; at: string }) => {
      console.log('🔔 SYSTEM EVENT:', data.type, data.roomId);
      // 시스템 메시지는 필요에 따라 UI에 표시 가능
    };

    const onWelcome = (data: { id: string; time: string }) => {
      console.log('👋 WELCOME:', data.id, data.time);
    };

    s.on("message", onMessage);
    s.on("message:ack", onAck);
    s.on("read:updated", onRead);
    s.on("joined", onJoined);
    s.on("left", onLeft);
    s.on("system", onSystem);
    s.on("welcome", onWelcome);

    return () => {
      s.off("message", onMessage);
      s.off("message:ack", onAck);
      s.off("read:updated", onRead);
      s.off("joined", onJoined);
      s.off("left", onLeft);
      s.off("system", onSystem);
      s.off("welcome", onWelcome);
    };
  }, [open, currentUserId, selectedChatId, onChatRoomUpdate]);

  // 메시지 전송
  const onSendMessage = useCallback(
    (roomId: string, content: string, messageType: "text" | "image" = "text") => {
      if (!token || !currentUserId) {
        console.error("메시지 전송 실패: 토큰 또는 사용자 ID 없음");
        return;
      }
      
      const now = new Date().toISOString();
      const tempId = `tmp-${Math.random().toString(36).slice(2)}`;
      const tempMsg: Message = {
        id: tempId,
        tempId,
        roomId,
        senderId: currentUserId,
        content,
        message_type: messageType,
        createdAt: now,
        status: "sending",
      };

      setMessagesByRoom((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] ?? []), tempMsg],
      }));

      const displayMessage = messageType === "image" ||
        (content && content.startsWith('chat/') && /\.(jpg|jpeg|png|gif|webp)$/i.test(content))
        ? "사진"
        : content;

      onChatRoomUpdate(roomId, {
        lastMessage: displayMessage,
        lastMessageAt: now,
        lastMessageSenderId: currentUserId, // 내가 보낸 메시지의 발송자 ID
        // 내가 보낸 메시지는 자동으로 읽음 처리 (알림이 뜨지 않도록)
        last_read_at: now,
        searchIndex: (displayMessage ?? "").toLocaleLowerCase("ko-KR"),
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
    
    if (trimmed === chatLastMessage.at(-1)) {
      return;
    }

    setChatLastMessage(trimmed)

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