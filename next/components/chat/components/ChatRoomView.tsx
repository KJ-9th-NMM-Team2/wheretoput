// 채팅방 대화 화면 컴포넌트
// 개별 채팅방에서 메시지들을 보여주고 메시지를 입력할 수 있는 화면

import { forwardRef } from "react";
import MessageBubble from "./shared/MessageBubble";
import { ChatListItem, Message } from "../types/chat-types";
import { shouldShowAvatar, shouldShowTimestamp } from "../utils/chat-utils";

interface ChatRoomViewProps {
  selectedChat: ChatListItem | null;
  groupedByDay: Record<string, Message[]>;
  text: string;
  setText: (text: string) => void;
  send: () => void;
  onEditorKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onBack: () => void;
  currentUserId: string | null;
}

const ChatRoomView = forwardRef<HTMLDivElement, ChatRoomViewProps>(
  ({
    selectedChat,
    groupedByDay,
    text,
    setText,
    send,
    onEditorKeyDown,
    onBack,
    currentUserId,
  }, listRef) => {
    return (
      <div className="flex flex-col h-full">
        <header className="px-3 py-2 flex items-center justify-between text-xl">
          <div className="flex min-w-0 items-center gap-2">
            <b className="px-2 truncate">
              {selectedChat?.name ?? "채팅"}
            </b>
          </div>
          <button
            onClick={onBack}
            className="px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
          >
            ←
          </button>
        </header>

        {/* 채팅내용 */}
        <div
          ref={listRef}
          className="flex-1 space-y-4 px-3 overflow-y-auto py-2"
        >
          {Object.entries(groupedByDay).map(([date, arr]) => (
            <div key={date} className="space-y-3">
              <div className="sticky top-0 z-10 flex justify-center">
                <span className="text-[11px] bg-white/80 backdrop-blur px-2 py-1 rounded-full border border-gray-200 text-gray-500">
                  {date}
                </span>
              </div>
              {arr.map((m, i) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  showAvatar={shouldShowAvatar(arr, i)}
                  showTimestamp={shouldShowTimestamp(arr, i)}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          ))}
        </div>

        {/* 푸터 */}
        <footer className="border-t border-gray-200 p-3">
          <div className="flex gap-2 items-end">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onEditorKeyDown}
              placeholder="메시지 입력..."
              rows={1}
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-300 max-h-40"
            />
            <button
              onClick={send}
              disabled={!text.trim()}
              className={`px-3 py-2 rounded-lg text-white cursor-pointer ${
                text.trim()
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              전송
            </button>
          </div>
        </footer>
      </div>
    );
  }
);

ChatRoomView.displayName = "ChatRoomView";

export default ChatRoomView;