// 채팅방 목록 관리 훅
// 채팅방 로드, 필터링, 정렬, 1:1 채팅 시작을 담당

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/client/api";
import { ChatListItem } from "../types/chat-types";
import { recomputeChats } from "../utils/chat-utils";
import { getSocket, getSocketStatus } from "@/lib/client/socket";
import { useChatSSE } from "./useChatSSE";

const NEXT_API_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const useChatRooms = (
  open: boolean,
  token: string | null,
  currentUserId: string | null,
  query: string,
  select: "전체" | "읽지 않음",
  enablePolling: boolean = false, // 기본값을 false로 변경 (SSE 사용)
  onNewMessage?: (roomId: string, message: any) => void // 새 메시지 콜백 추가
) => {
  const { data: session } = useSession();
  const [baseChats, setBaseChats] = useState<ChatListItem[]>([]);
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const prevChatsRef = useRef<ChatListItem[]>([]);

  /*
   * 역할 분리:
   * - WebSocket: 실시간 메시지 송수신 (채팅방 안에서)
   * - SSE: 채팅방 목록 업데이트 (백그라운드 알림)
   * 
   * 충돌 방지:
   * - SSE는 타임스탬프 기반으로 중복 업데이트 방지
   * - 새 메시지 알림은 백그라운드에서만 처리
   */

  // SSE 채팅방 업데이트 처리 (중복 방지 로직 추가)
  const handleSSERoomUpdate = useCallback(
    (roomId: string, updates: Partial<ChatListItem>) => {
      // 타임스탬프 기반 중복 방지 (WebSocket 업데이트와 충돌 방지)
      setBaseChats((prev) => {
        const existingRoom = prev.find(c => c.chat_room_id === roomId);
        
        // 기존 메시지보다 새로운 메시지인 경우에만 업데이트
        if (existingRoom && updates.lastMessageAt && existingRoom.lastMessageAt) {
          const newMessageTime = new Date(updates.lastMessageAt).getTime();
          const existingMessageTime = new Date(existingRoom.lastMessageAt).getTime();
          
          // 기존 메시지가 더 최신이면 업데이트하지 않음 (WebSocket이 이미 처리함)
          if (existingMessageTime >= newMessageTime) {
            return prev;
          }
        }
        
        const updated = prev.map((c) =>
          c.chat_room_id === roomId ? { ...c, ...updates } : c
        );
        setChats(recomputeChats(updated, query, select, currentUserId));
        return updated;
      });
    },
    [query, select, currentUserId]
  );

  // SSE 새 메시지 처리 (WebSocket과 중복을 피하기 위해 백그라운드에서만)
  const handleSSENewMessage = useCallback(
    (roomId: string, messageData: any) => {
      // 채팅 팝업이 닫혀있을 때만 처리 (WebSocket과 중복 방지)
      if (!open && onNewMessage) {
        onNewMessage(roomId, messageData);
      }
    },
    [onNewMessage, open]
  );

  // SSE 읽음 상태 업데이트 처리
  const handleSSEReadUpdate = useCallback(
    (roomId: string, userId: string, readAt: string) => {
      if (userId === currentUserId) {
        setBaseChats((prev) => {
          const updated = prev.map((c) =>
            c.chat_room_id === roomId ? { ...c, last_read_at: readAt } : c
          );
          setChats(recomputeChats(updated, query, select, currentUserId));
          return updated;
        });
      }
    },
    [query, select, currentUserId]
  );

  // SSE 연결 활성화 (폴링을 사용하지 않을 때 - 항상 백그라운드에서 실행)
  const sseConnection = useChatSSE({
    enabled: !enablePolling, // 팝업 상태와 무관하게 항상 연결
    onRoomUpdate: handleSSERoomUpdate,
    onNewMessage: handleSSENewMessage,
    onReadUpdate: handleSSEReadUpdate,
  });


  // 방 목록 로드 - 요청 제한 추가
  useEffect(() => {
    if (!open || !token) {
      return;
    }

    let isLoading = false;
    let lastLoadTime = 0;
    
    const loadRooms = async () => {
      // 중복 요청 방지
      if (isLoading) return;
      
      // 최소 간격 제한 (3초)
      const now = Date.now();
      if (now - lastLoadTime < 3000) {
        return;
      }
      
      isLoading = true;
      lastLoadTime = now;

      const path = "/backend/rooms";
      try {
        const response = await fetch("/api/backend/rooms", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        const mapped: ChatListItem[] = (data ?? []).map((r: any) => {
          r.last_message = r.chat_messages[0] ?? null;

          // 마지막 메시지가 이미지인지 확인
          let lastMsg = r.last_message?.content ?? r.lastMessage ?? "";
          const messageType = r.last_message?.message_type;

          // 이미지 메시지인 경우 "사진"으로 표시
          if (
            messageType === "image" ||
            (lastMsg &&
              lastMsg.startsWith("chat/") &&
              /\.(jpg|jpeg|png|gif|webp)$/i.test(lastMsg))
          ) {
            lastMsg = "사진";
          }

          const chatRoomName = r.chat_participants
            .filter((participant: any) => participant.user_id !== currentUserId)
            .map((participant: any) => participant.user?.name || "이름 없음")
            .join(", ");

          const result = {
            chat_room_id: r.chat_room_id ?? r.id ?? String(r.room_id ?? ""),
            name: chatRoomName,
            is_private: Boolean(r.is_private),
            lastMessage: lastMsg,
            lastMessageAt:
              r.last_message?.created_at ?? r.lastMessageAt ?? undefined,
            lastMessageSenderId: r.last_message?.user_id ?? undefined,
            last_read_at: r.last_read_at ?? "1970-01-01T00:00:00.000Z",
            searchIndex: (lastMsg ?? "").toLocaleLowerCase("ko-KR"),
          };

          // 마지막 메시지가 내가 보낸 메시지라면 강제로 읽음 처리
          if (
            result.lastMessageSenderId === currentUserId &&
            result.lastMessageAt
          ) {
            result.last_read_at = result.lastMessageAt;
          }


          return result;
        });

        setBaseChats(mapped);
        setChats(recomputeChats(mapped, "", "전체", currentUserId));
      } catch (e: any) {
        console.error("[ROOMS] FAIL", {
          url: path,
          status: e?.response?.status,
          data: e?.response?.data,
          message: e?.message,
          tokenExists: !!token,
        });
      } finally {
        isLoading = false;
      }
    };

    // 초기 로드
    loadRooms();
  }, [open, token, currentUserId]);


  // 1:1 채팅 시작
  const onStartDirect = useCallback(
    async (otherUserId: string, otherUserName?: string) => {
      if (!token) {
        console.error("토큰이 없습니다");
        return null;
      }


      const { data } = await api.post(
        `${NEXT_API_URL}/api/backend/rooms/direct`,
        {
          currentUserId: currentUserId || session?.user?.id,
          otherUserId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const roomId =
        data?.chat_room_id ?? data?.roomId ?? data?.id ?? String(data?.room_id);
      if (!roomId) return null;

      setBaseChats((prev) => {
        const existingIndex = prev.findIndex((c) => c.chat_room_id === roomId);
        if (existingIndex !== -1) {
          const next = [...prev];
          // 기존 채팅방의 이름을 API 응답으로 업데이트 (null이면 otherUserName 사용)
          next[existingIndex] = {
            ...next[existingIndex],
            name: data?.name ?? otherUserName ?? next[existingIndex].name,
          };
          setChats(recomputeChats(next, "", "전체", currentUserId));
          return next;
        }
        const next = [
          {
            chat_room_id: roomId,
            name: data?.name ?? otherUserName ?? "새 대화", // 채팅방 이름 우선, 없으면 상대방 이름
            is_private: true,
            lastMessage: "",
            lastMessageAt: undefined, // 빈 채팅방은 마지막 메시지 시간이 없음
            last_read_at: new Date().toISOString(), // 생성과 동시에 읽음 처리
            searchIndex: "",
          },
          ...prev,
        ];
        setChats(recomputeChats(next, "", "전체", currentUserId));
        return next;
      });

      return roomId;
    },
    [token, currentUserId, session?.user?.id]
  );

  // 채팅방 업데이트 (메시지 수신 시 사용)
  const updateChatRoom = useCallback(
    (roomId: string, updates: Partial<ChatListItem>) => {
      setBaseChats((prev) => {
        const updated = prev.map((c) =>
          c.chat_room_id === roomId ? { ...c, ...updates } : c
        );
        setChats(recomputeChats(updated, query, select, currentUserId));
        return updated;
      });
    },
    [query, select, currentUserId]
  );

  // 채팅방 삭제 (로컬 상태에서 제거)
  const deleteChatRoom = useCallback(
    (roomId: string) => {
      setBaseChats((prev) => {
        const filtered = prev.filter((c) => c.chat_room_id !== roomId);
        setChats(recomputeChats(filtered, query, select, currentUserId));
        return filtered;
      });
    },
    [query, select, currentUserId]
  );

  return {
    baseChats,
    chats,
    setChats,
    setBaseChats,
    onStartDirect,
    updateChatRoom,
    deleteChatRoom,
    refreshRooms: () => {}, // 폴링 비활성화로 인해 빈 함수 반환
    sseConnection, // SSE 연결 상태 정보
  };
};
