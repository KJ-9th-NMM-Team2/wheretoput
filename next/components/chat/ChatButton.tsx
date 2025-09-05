"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence } from "framer-motion";

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
  if (!currentUserId) return null;

  const [open, setOpen] = useState(false);
  const [select, setSelect] = useState<"전체" | "읽지 않음">("전체");
  const [selectedChatId, setselectedChatId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // 분리된 훅들 사용
  const { token } = useChatConnection(open);

  const { baseChats, chats, setChats, setBaseChats, onStartDirect, updateChatRoom } = useChatRooms(
    open,
    token,
    currentUserId,
    query,
    select
  );

  const {
    selectedMessages,
    groupedByDay,
    text,
    setText,
    send,
    onSendMessage,
    onEditorKeyDown
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
    setTimeout(scrollToBottom, 0);    // 즉시
    setTimeout(scrollToBottom, 50);   // 50ms 후
    setTimeout(scrollToBottom, 200);  // 200ms 후
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

  // 1:1 채팅 시작 핸들러
  const handleStartDirect = async (otherUserId: string, otherUserName?: string) => {
    // 필터 초기화
    setQuery("");
    setSelect("전체");

    const roomId = await onStartDirect(otherUserId, otherUserName);
    if (roomId) {
      setselectedChatId(roomId);
    }
  };

  return (
    <>
      <ChatFloatingButton
        ref={buttonRef}
        onClick={() =>
          setOpen((prev) => {
            const next = !prev;
            if (next) {
              setSelect("전체");
              setChats(recomputeChats(baseChats, "", "전체"));
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
            onBack={() => setselectedChatId(null)}
            currentUserId={currentUserId}
            listRef={listRef}
          />
        )}
      </AnimatePresence>
    </>
  );
}
