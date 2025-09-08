// 협업 모드 전용 채팅방 선택 버튼
// 작은 사이즈로 우측 하단에 위치

import { useState, useRef, useEffect } from "react";
import { ChatListItem } from "../types/chat-types";
import { useChatConnection } from "../hooks/useChatConnection";
import { useChatRooms } from "../hooks/useChatRooms";

interface CollaborationChatRoomSelectorProps {
  selectedChatId: string | null;
  onChatSelect: (chatId: string | null) => void;
  currentUserId: string | null;
}

export default function CollaborationChatRoomSelector({
  selectedChatId,
  onChatSelect,
  currentUserId,
}: CollaborationChatRoomSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 채팅 관련 훅 사용 - socket 연결은 page에서 관리하므로 여기서는 token만 가져옴
  const { token } = useChatConnection(false); // 연결하지 않고 token만 사용
  const { chats } = useChatRooms(
    isOpen, // 팝업이 열릴 때만 활성화
    token,
    currentUserId,
    "", // query
    "전체", // select
    false // enablePolling - collaboration 환경에서는 폴링 비활성화
  );

  // 현재 선택된 채팅방 정보
  const selectedChat = chats.find(
    (chat) => chat.chat_room_id === selectedChatId
  );

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="fixed bottom-4 right-4 z-[1000]">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-lg shadow-sm hover:bg-white transition-colors text-sm"
      >
        <svg
          className="w-4 h-4 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span className="text-gray-700">
          {selectedChat ? selectedChat.name : "채팅방 선택"}
        </span>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full mb-2 right-0 w-64 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-[1001]"
        >
            {chats.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                채팅방이 없습니다
              </div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.chat_room_id}
                  onClick={() => {
                    // 이미 선택된 채팅방이면 선택 해제, 아니면 선택
                    onChatSelect(selectedChatId === chat.chat_room_id ? null : chat.chat_room_id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                    selectedChatId === chat.chat_room_id
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
                      <span className="text-xs text-gray-600">
                        {chat.name?.charAt(0) || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {chat.name}
                      </div>
                      {chat.lastMessage && (
                        <div className="text-xs text-gray-500 truncate">
                          {chat.lastMessage}
                        </div>
                      )}
                    </div>
                    {chat.unread_count > 0 && (
                      <div className="flex-shrink-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {chat.unread_count}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
        </div>
      )}
    </div>
  );
}
