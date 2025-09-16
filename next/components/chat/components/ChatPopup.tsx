// 채팅 팝업 컨테이너 컴포넌트  
// 채팅 팝업의 전체 레이아웃과 화면 전환을 관리

import { forwardRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatListView from "./ChatListView";
import ChatRoomView from "./ChatRoomView";
import { ChatListItem, UserLite, Message } from "../types/chat-types";
import { useStore } from "@/components/sim/useStore.js";

interface ChatPopupProps {
  selectedChatId: string | null;
  selectedChat: ChatListItem | null;
  query: string;
  setQuery: (query: string) => void;
  select: "전체" | "읽지 않음";
  setSelect: (select: "전체" | "읽지 않음") => void;
  baseChats: ChatListItem[];
  chats: ChatListItem[];
  setChats: (chats: ChatListItem[]) => void;
  setBaseChats: (chats: ChatListItem[]) => void;
  peopleHits: UserLite[];
  groupedByDay: Record<string, Message[]>;
  text: string;
  setText: (text: string) => void;
  send: () => void;
  onSendMessage: (roomId: string, content: string, messageType?: "text" | "image") => void;
  onEditorKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onChatSelect: (chatId: string) => void;
  onBack: () => void;
  currentUserId: string | null;
  listRef: React.RefObject<HTMLDivElement>;
  onStartDirect?: (userId: string, userName?: string) => Promise<void>;
}

const ChatPopup = forwardRef<HTMLDivElement, ChatPopupProps>(
  ({
    selectedChatId,
    selectedChat,
    query,
    setQuery,
    select,
    setSelect,
    baseChats,
    chats,
    setChats,
    setBaseChats,
    peopleHits,
    groupedByDay,
    text,
    setText,
    send,
    onSendMessage,
    onEditorKeyDown,
    onChatSelect,
    onBack,
    currentUserId,
    listRef,
    onStartDirect,
  }, popupRef) => {
    const { setIsChatFocused } = useStore();
    return (
      <motion.div
        ref={popupRef}
        key="chat-popup"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        style={{ transformOrigin: "100% 100%" }}
        className="fixed right-6 bottom-24 z-[1001] w-[min(360px,calc(100vw-32px))] h-[420px] bg-white text-black rounded-xl border border-gray-300 shadow-lg flex flex-col overflow-hidden"
      >
        <AnimatePresence mode="wait" initial={false}>
          {selectedChatId === null ? (
            // 리스트 화면
            <motion.div
              key="list"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="w-full h-full"
            >
              <ChatListView
                query={query}
                setQuery={setQuery}
                select={select}
                setSelect={setSelect}
                baseChats={baseChats}
                chats={chats}
                setChats={setChats}
                setBaseChats={setBaseChats}
                peopleHits={peopleHits}
                onChatSelect={onChatSelect}
                currentUserId={currentUserId}
                onChatFocus={setIsChatFocused}
                onStartDirect={onStartDirect}
              />
            </motion.div>
          ) : (
            // 채팅방 화면
            <motion.div
              key="room"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="w-full h-full"
            >
              <ChatRoomView
                ref={listRef}
                selectedChat={selectedChat}
                groupedByDay={groupedByDay}
                text={text}
                setText={setText}
                send={send}
                onSendMessage={onSendMessage}
                onEditorKeyDown={onEditorKeyDown}
                onBack={onBack}
                currentUserId={currentUserId}
                onChatFocus={setIsChatFocused}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

ChatPopup.displayName = "ChatPopup";

export default ChatPopup;