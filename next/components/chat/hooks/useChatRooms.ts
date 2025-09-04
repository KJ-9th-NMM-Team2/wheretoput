// 채팅방 목록 관리 훅
// 채팅방 로드, 필터링, 정렬, 1:1 채팅 시작을 담당

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/client/api";
import { ChatListItem } from "../types/chat-types";
import { recomputeChats } from "../utils/chat-utils";

const NEXT_API_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const useChatRooms = (
  open: boolean,
  token: string | null,
  currentUserId: string | null,
  query: string,
  select: "전체" | "읽지 않음"
) => {
  const { data: session } = useSession();
  const [baseChats, setBaseChats] = useState<ChatListItem[]>([]);
  const [chats, setChats] = useState<ChatListItem[]>([]);

  // 방 목록 로드
  useEffect(() => {
    if (!open || !token) {
      console.log("[ROOMS] 스킵 - open:", open, "token:", !!token);
      return;
    }

    (async () => {
      const path = "/backend/rooms";
      try {
        console.log("[ROOMS] GET", path);
        const response = await fetch(
          "http://localhost:3000/api/backend/rooms",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json();

        const mapped: ChatListItem[] = (data ?? []).map((r: any) => {
          console.log("메시지 데이터:", r.creator_id, currentUserId);
          r.last_message = r.chat_messages[0] ?? null; // 낙관적 접근
          console.log("마지막 메시지: ", r.last_message);
          const lastMsg = r.last_message?.content ?? r.lastMessage ?? "";
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
            last_read_at: r.last_read_at ?? "1970-01-01T00:00:00.000Z",
            searchIndex: (lastMsg ?? "").toLocaleLowerCase("ko-KR"),
          };

          console.log(
            "lastMessageAt:",
            result.lastMessageAt,
            "last_read_at:",
            result.last_read_at
          );

          return result;
        });

        setBaseChats(mapped);
        setChats(recomputeChats(mapped, "", "전체"));

        console.log("[ROOMS] OK", mapped.length);
      } catch (e: any) {
        console.error("[ROOMS] FAIL", {
          url: path,
          status: e?.response?.status,
          data: e?.response?.data,
          message: e?.message,
          tokenExists: !!token,
        });
      }
    })();
  }, [open, token, currentUserId]);

  // 1:1 채팅 시작
  const onStartDirect = useCallback(
    async (otherUserId: string, otherUserName?: string) => {
      if (!token) {
        console.error("토큰이 없습니다");
        return null;
      }

      console.log("Creating chat room:");
      console.log("- currentUserId prop:", currentUserId);
      console.log("- session?.user?.id:", session?.user?.id);
      console.log("- otherUserId:", otherUserId);
      console.log("- otherUserName:", otherUserName);

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

      console.log("API Response:", data);

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
          setChats(recomputeChats(next, "", "전체"));
          return next;
        }
        const next = [
          {
            chat_room_id: roomId,
            name: data?.name ?? otherUserName ?? "새 대화", // 채팅방 이름 우선, 없으면 상대방 이름
            is_private: true,
            lastMessage: "",
            lastMessageAt: new Date().toISOString(),
            last_read_at: "1970-01-01T00:00:00.000Z",
            searchIndex: "",
          },
          ...prev,
        ];
        setChats(recomputeChats(next, "", "전체"));
        return next;
      });

      return roomId;
    },
    [token, currentUserId, session?.user?.id]
  );

  // 채팅방 업데이트 (메시지 수신 시 사용)
  const updateChatRoom = useCallback((roomId: string, updates: Partial<ChatListItem>) => {
    setBaseChats((prev) => {
      const updated = prev.map((c) =>
        c.chat_room_id === roomId ? { ...c, ...updates } : c
      );
      setChats(recomputeChats(updated, query, select));
      return updated;
    });
  }, [query, select]);

  return {
    baseChats,
    chats,
    setChats,
    setBaseChats,
    onStartDirect,
    updateChatRoom,
  };
};