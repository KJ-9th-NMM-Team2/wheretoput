// 채팅방 목록 관리 훅
// 채팅방 로드, 필터링, 정렬, 1:1 채팅 시작을 담당

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/client/api";
import { ChatListItem } from "../types/chat-types";
import { recomputeChats } from "../utils/chat-utils";
import { getSocket, getSocketStatus } from "@/lib/client/socket";

const NEXT_API_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const useChatRooms = (
  open: boolean,
  token: string | null,
  currentUserId: string | null,
  query: string,
  select: "전체" | "읽지 않음",
  enablePolling: boolean = true,
  onNewMessage?: (roomId: string, message: any) => void // 새 메시지 콜백 추가
) => {
  const { data: session } = useSession();
  const [baseChats, setBaseChats] = useState<ChatListItem[]>([]);
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const prevChatsRef = useRef<ChatListItem[]>([]);

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
        console.log("[ROOMS] GET", path);
        const response = await fetch("/api/backend/rooms", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        const mapped: ChatListItem[] = (data ?? []).map((r: any) => {
          // console.log("메시지 데이터:", r.creator_id, currentUserId);
          r.last_message = r.chat_messages[0] ?? null; // 낙관적 접근
          // console.log("마지막 메시지: ", r.last_message);

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

          console.log(
            "lastMessageAt:",
            result.lastMessageAt,
            "last_read_at:",
            result.last_read_at
          );

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
      } finally {
        isLoading = false;
      }
    };

    // 초기 로드
    loadRooms();
  }, [open, token, currentUserId]);

  // 개선된 폴링 시스템 - 소켓 상태 기반 동적 폴링 (주석처리)
  /*useEffect(() => {
    if (!token || !enablePolling) return;

    let isPolling = false; // 폴링 중복 실행 방지
    let lastUpdateTime = 0; // 마지막 업데이트 시간
    let currentInterval: NodeJS.Timeout | null = null;

    const loadRooms = async () => {
      // 폴링 중복 실행 방지
      if (isPolling) {
        return;
      }

      isPolling = true;
      
      try {
        const response = await fetch(`${NEXT_API_URL}/api/backend/rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        const prevChats = prevChatsRef.current;
        const currentTime = Date.now();

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
          if (
            result.lastMessageSenderId === currentUserId &&
            result.lastMessageAt
          ) {
            result.last_read_at = result.lastMessageAt;
          }

          return result;
        });

        // 새 메시지 감지 및 알림 (백그라운드일 때만)
        if (!open && onNewMessage && prevChats.length > 0) {
          mapped.forEach(currentRoom => {
            const prevRoom = prevChats.find(p => p.chat_room_id === currentRoom.chat_room_id);
            if (prevRoom && 
                currentRoom.lastMessageAt && 
                prevRoom.lastMessageAt &&
                new Date(currentRoom.lastMessageAt) > new Date(prevRoom.lastMessageAt) &&
                currentRoom.lastMessageSenderId !== currentUserId) {
              // 새 메시지가 있고, 내가 보낸 메시지가 아닌 경우 알림
              onNewMessage(currentRoom.chat_room_id, currentRoom);
            }
          });
        }

        // 실시간 이벤트로 인한 최근 업데이트가 있다면 폴링 데이터보다 우선
        const timeSinceLastUpdate = currentTime - lastUpdateTime;
        if (timeSinceLastUpdate < 1000 && open) {
          isPolling = false;
          return;
        }

        setBaseChats(mapped);
        prevChatsRef.current = mapped;
        setChats(recomputeChats(mapped, query, select, currentUserId));
        lastUpdateTime = currentTime;

      } catch (e) {
      } finally {
        isPolling = false;
      }
    };

    // 즉시 한 번 실행
    loadRooms();

    // 폴링 간격 설정 및 업데이트 함수
    const setupPolling = () => {
      if (currentInterval) {
        clearInterval(currentInterval);
      }
      
      const socketStatus = getSocketStatus();
      const isSocketConnected = socketStatus.connected;
      
      // 소켓 연결됨: 30초/60초, 소켓 끊어짐: 5초/10초
      const pollInterval = isSocketConnected 
        ? (open ? 30000 : 60000)  // 소켓 정상: 긴 간격
        : (open ? 5000 : 10000);   // 소켓 끊어짐: 짧은 간격
        
      currentInterval = setInterval(loadRooms, pollInterval);
    };
    
    // 초기 폴링 설정
    setupPolling();
    
    // 소켓 상태 변화 감지를 위한 주기적 체크 (10초마다)
    const statusCheckInterval = setInterval(setupPolling, 10000);

    return () => {
      if (currentInterval) clearInterval(currentInterval);
      if (statusCheckInterval) clearInterval(statusCheckInterval);
      isPolling = false;
    };
  }, [open, token, currentUserId, query, select, enablePolling, onNewMessage]);*/

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
    refreshRooms: () => {}, // 폴링 비활성화로 인해 빈 함수 반환
  };
};
