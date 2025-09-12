"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

// 분리된 훅들과 유틸들 import
import { useChatConnection } from "./hooks/useChatConnection";
import { useChatRooms } from "./hooks/useChatRooms";
import { useChatMessages } from "./hooks/useChatMessages";
import { useUserSearch } from "./hooks/useUserSearch";
import { recomputeChats } from "./utils/chat-utils";

// 분리된 컴포넌트들 import
import ChatFloatingButton from "./components/ChatFloatingButton";
import ChatPopup from "./components/ChatPopup";

export default function ChatButton({
  currentUserId,
}: {
  currentUserId: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [select, setSelect] = useState<"전체" | "읽지 않음">("전체");
  const [selectedChatId, setselectedChatId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  // 분리된 훅들 사용 - 조건부 return 전에 모든 Hook 호출
  const { token } = useChatConnection(open);

  // 새 메시지 알림 처리
  const handleNewMessage = (roomId: string, room: any) => {
    console.log("🔔 새 메시지 알림:", room.name, room.lastMessage);

    // 읽지 않은 메시지 뱃지 표시
    setHasUnreadMessages(true);

    // 브라우저 알림 권한 확인 후 알림 표시
    if (Notification.permission === "granted") {
      new Notification(`${room.name}에서 새 메시지`, {
        body:
          room.lastMessage === "사진" ? "사진을 보냈습니다" : room.lastMessage,
        icon: "/favicon.ico", // 앱 아이콘
        tag: roomId, // 같은 채팅방의 알림은 덮어쓰기
      });
    } else if (Notification.permission === "default") {
      // 알림 권한 요청
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(`${room.name}에서 새 메시지`, {
            body:
              room.lastMessage === "사진"
                ? "사진을 보냈습니다"
                : room.lastMessage,
            icon: "/favicon.ico",
            tag: roomId,
          });
        }
      });
    }
  };

  const {
    baseChats,
    chats,
    setChats,
    setBaseChats,
    onStartDirect,
    updateChatRoom,
    deleteChatRoom,
    sseConnection,
  } = useChatRooms(
    open,
    token,
    currentUserId,
    query,
    select,
    false, // SSE 사용으로 폴링 비활성화
    handleNewMessage // 새 메시지 콜백
  );

  const {
    selectedMessages,
    groupedByDay,
    text,
    setText,
    send,
    onSendMessage,
    onEditorKeyDown,
  } = useChatMessages(
    open,
    selectedChatId,
    token,
    currentUserId,
    updateChatRoom
  );

  const { peopleHits } = useUserSearch(open, query, currentUserId);

  const selectedChat = useMemo(() => {
    if (!selectedChatId) return null;
    return baseChats.find((c) => c.chat_room_id === selectedChatId) ?? null;
  }, [selectedChatId, baseChats]);

  // 읽지 않은 메시지 수 계산
  const unreadCount = useMemo(() => {
    if (!currentUserId) return 0;
    return baseChats.filter((chat) => {
      if (!chat.lastMessageAt || !chat.last_read_at) return false;
      return (
        new Date(chat.lastMessageAt) > new Date(chat.last_read_at) &&
        chat.lastMessageSenderId !== currentUserId
      );
    }).length;
  }, [baseChats, currentUserId]);

  // 읽지 않은 메시지가 있으면 뱃지 표시
  useEffect(() => {
    setHasUnreadMessages(unreadCount > 0);
  }, [unreadCount]);

  // UI 관련 refs와 스크롤 처리
  const listRef = useRef<HTMLDivElement | null>(null);
  const userAtBottomRef = useRef(true);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      userAtBottomRef.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < 10;
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // 채팅방 변경 시 맨 아래로 스크롤
  useEffect(() => {
    if (!selectedChatId) return;

    const scrollToBottom = () => {
      const el = listRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
        userAtBottomRef.current = true;
      }
    };

    // 여러 시점에서 스크롤 시도
    setTimeout(scrollToBottom, 0); // 즉시
    setTimeout(scrollToBottom, 50); // 50ms 후
    setTimeout(scrollToBottom, 200); // 200ms 후
  }, [selectedChatId]);

  // 새 메시지 추가 시 맨 아래로 스크롤
  useEffect(() => {
    const el = listRef.current;
    if (el && selectedMessages.length > 0) {
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
        userAtBottomRef.current = true;
      }, 0);
    }
  }, [selectedMessages.length]);

  // 팝업 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setselectedChatId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // 조건부 return들 - 모든 Hook 호출 이후에 배치
  if (!currentUserId) return null;

  // sim/collaboration, sim/mobile 페이지에서는 채팅 버튼을 숨김
  if (
    pathname?.includes("/sim/collaboration/") ||
    pathname?.includes("/sim/mobile/")
  ) {
    return null;
  }

  // 1:1 채팅 시작 핸들러
  const handleStartDirect = async (
    otherUserId: string,
    otherUserName?: string
  ) => {
    // 필터 초기화
    setQuery("");
    setSelect("전체");

    const roomId = await onStartDirect(otherUserId, otherUserName);
    if (roomId) {
      // baseChats 상태 업데이트 완료를 위해 약간의 지연
      setTimeout(() => {
        setselectedChatId(roomId);
      }, 100);
    }
  };

  return (
    <>
      <ChatFloatingButton
        ref={buttonRef}
        hasUnreadMessages={hasUnreadMessages}
        onClick={() =>
          setOpen((prev) => {
            const next = !prev;
            if (next) {
              setSelect("전체");
              setChats(recomputeChats(baseChats, "", "전체", currentUserId));
            } else {
              setselectedChatId(null);
            }
            return next;
          })
        }
      />

      <AnimatePresence>
        {open && (
          <ChatPopup
            ref={popupRef}
            selectedChatId={selectedChatId}
            selectedChat={selectedChat}
            query={query}
            setQuery={setQuery}
            select={select}
            setSelect={setSelect}
            baseChats={baseChats}
            chats={chats}
            setChats={setChats}
            setBaseChats={setBaseChats}
            peopleHits={peopleHits}
            groupedByDay={groupedByDay}
            text={text}
            setText={setText}
            send={send}
            onSendMessage={onSendMessage}
            onEditorKeyDown={onEditorKeyDown}
            onChatSelect={(chatId) => setselectedChatId(chatId)}
            onStartDirect={handleStartDirect}
            onBack={() => {
              // 채팅방에서 나갈 때 해당 채팅방의 읽음 상태를 현재 시간으로 업데이트
              if (selectedChatId) {
                updateChatRoom(selectedChatId, {
                  last_read_at: new Date().toISOString(),
                });
              }
              setselectedChatId(null);
            }}
            currentUserId={currentUserId}
            listRef={listRef}
          />
        )}
      </AnimatePresence>
    </>
  );
}
