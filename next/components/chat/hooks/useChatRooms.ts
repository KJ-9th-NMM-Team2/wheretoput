// 채팅방 목록 관리 훅
// 채팅방 로드, 필터링, 정렬, 1:1 채팅 시작을 담당

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/client/api";
import { ChatListItem } from "../types/chat-types";
import { recomputeChats } from "../utils/chat-utils";
import { getSocket } from "@/lib/client/socket";

const NEXT_API_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const useChatRooms = (
  open: boolean,
  token: string | null,
  currentUserId: string | null,
  query: string,
  select: "전체" | "읽지 않음",
  enablePolling: boolean = true
) => {
  const { data: session } = useSession();
  const [baseChats, setBaseChats] = useState<ChatListItem[]>([]);
  const [chats, setChats] = useState<ChatListItem[]>([]);

  // 방 목록 로드
  useEffect(() => {
    if (!open || !token) {
      return;
    }

    (async () => {
      const path = "/backend/rooms";
      try {
        console.log("[ROOMS] GET", path);
        const response = await fetch("/api/backend/rooms", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        const mapped: ChatListItem[] = (data ?? []).map((r: any) => {
          console.log("메시지 데이터:", r.creator_id, currentUserId);
          r.last_message = r.chat_messages[0] ?? null; // 낙관적 접근
          console.log("마지막 메시지: ", r.last_message);

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
          // console.log("마지막 메시지가 누가 보냈을까?");
          // console.log("result.lastMessageSenderId", result.lastMessageSenderId);
          // console.log("currentUserId", currentUserId);
          // console.log("result.lastMessageAt", result.lastMessageAt);
          // if (
          //   result.lastMessageSenderId === currentUserId &&
          //   result.lastMessageAt
          // ) {
          //   result.last_read_at = result.lastMessageAt;
          // }

          // console.log(
          //   "lastMessageAt:",
          //   result.lastMessageAt,
          //   "last_read_at:",
          //   result.last_read_at
          // );

          return result;
        });

        setBaseChats(mapped);
        setChats(recomputeChats(mapped, "", "전체", currentUserId));

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

  // 실시간 폴링 (5초마다) - 안정적인 채팅방 목록 업데이트
  useEffect(() => {
    if (!open || !token || !enablePolling) return;

    const loadRooms = async () => {
      try {
        console.log("[POLLING] 채팅방 목록 업데이트 시작");
        const response = await fetch(`${NEXT_API_URL}/api/backend/rooms`, {
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

          // // 마지막 메시지가 내가 보낸 메시지라면 강제로 읽음 처리
          // if (
          //   result.lastMessageSenderId === currentUserId &&
          //   result.lastMessageAt
          // ) {
          //   result.last_read_at = result.lastMessageAt;
          // }

          return result;
        });

        setBaseChats(mapped);
        setChats(recomputeChats(mapped, query, select, currentUserId));
        console.log(
          "[POLLING] 채팅방 목록 업데이트 완료 -",
          mapped.length,
          "개 방"
        );
      } catch (e) {
        console.error("[POLLING] FAIL", e);
      }
    };

    // 즉시 한 번 실행
    loadRooms();

    // 1초마다 폴링 - 실시간 업데이트
    const interval = setInterval(loadRooms, 3000);

    return () => {
      console.log("[POLLING] 폴링 중단");
      clearInterval(interval);
    };
  }, [open, token, currentUserId, query, select, enablePolling]);

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
      console.log("🗑️ useChatRooms: 채팅방 삭제", roomId);
      setBaseChats((prev) => {
        const filtered = prev.filter((c) => c.chat_room_id !== roomId);
        console.log(
          "✅ useChatRooms: baseChats 업데이트",
          prev.length,
          "→",
          filtered.length
        );
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
  };
};
