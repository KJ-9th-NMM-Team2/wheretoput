// 협업 모드 전용 채팅방 선택 버튼
// 작은 사이즈로 우측 하단에 위치

import { useState, useRef, useEffect } from "react";
import { ChatListItem } from "../types/chat-types";
import { useChatConnection } from "../hooks/useChatConnection";
import { useChatRooms } from "../hooks/useChatRooms";
import { recomputeChats } from "../utils/chat-utils";
import { api } from "@/lib/client/api";

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
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<{
    chatId: string;
    x: number;
    y: number;
  } | null>(null);
  const [renameModal, setRenameModal] = useState<{
    chatId: string;
    chatName: string;
  } | null>(null);

  // 채팅 관련 훅 사용 - socket 연결은 page에서 관리하므로 여기서는 token만 가져옴
  const { token } = useChatConnection(false); // 연결하지 않고 token만 사용
  const { chats, setChats, baseChats, setBaseChats } = useChatRooms(
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

  // 우클릭 컨텍스트 메뉴 표시
  const handleContextMenu = (event: React.MouseEvent, chatId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      chatId,
      x: event.clientX,
      y: event.clientY,
    });
  };

  // 컨텍스트 메뉴 닫기
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // 이름 변경 모달 열기
  const openRenameModal = (chatId: string) => {
    closeContextMenu();
    const chat = chats.find((c) => c.chat_room_id === chatId);
    if (chat) {
      setRenameModal({
        chatId,
        chatName: chat.name || "이름 없는 채팅방",
      });
    }
  };

  // 이름 변경 모달 닫기
  const closeRenameModal = () => {
    setRenameModal(null);
  };

  // 채팅방 이름 변경 실행
  const handleRenameRoom = async (roomId: string, newName: string) => {
    if (!newName.trim()) return;

    try {
      await api.put(`${process.env.NEXT_PUBLIC_API_URL}/rooms/${roomId}/rename`, {
        name: newName.trim(),
      });

      // 로컬 상태 즉시 업데이트 (커스텀 이름이 최우선이므로 name 필드를 직접 업데이트)
      const updatedChats = baseChats.map((chat) =>
        chat.chat_room_id === roomId
          ? { ...chat, name: newName.trim() }
          : chat
      );
      setBaseChats(updatedChats);
      setChats(recomputeChats(updatedChats, "", "전체", currentUserId));

      closeRenameModal();
    } catch (error: any) {
      console.error("이름 변경 실패:", error);
      const errorMsg =
        error.response?.data?.message || "이름 변경에 실패했습니다.";
      alert(`변경 실패: ${errorMsg}`);
    }
  };

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

  // 클릭 시 컨텍스트 메뉴 닫기
  useEffect(() => {
    const handleClick = () => closeContextMenu();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[1000]">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-lg shadow-sm hover:bg-white transition-colors text-sm cursor-pointer"
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
        <span className="text-gray-700 truncate max-w-[200px]">
          {selectedChat ? selectedChat.name : "채팅방 선택"}
        </span>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""
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
                  onChatSelect(
                    selectedChatId === chat.chat_room_id
                      ? null
                      : chat.chat_room_id
                  );
                  setIsOpen(false);
                }}
                onContextMenu={(e) => handleContextMenu(e, chat.chat_room_id)}
                className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer ${selectedChatId === chat.chat_room_id
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-700"
                  }`}
              >
                <div className="flex items-center space-x-3">
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
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <div
          className="fixed z-[9998] bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => openRenameModal(contextMenu.chatId)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            이름 변경
          </button>
        </div>
      )}

      {/* 이름 변경 모달 */}
      {renameModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                채팅방 이름 변경
              </h3>
              <p className="text-gray-600 mb-4">
                "<span className="font-medium">{renameModal.chatName}</span>" 의 채팅방 이름을 변경합니다.
              </p>
              <input
                ref={renameInputRef}
                type="text"
                defaultValue={renameModal.chatName}
                placeholder="새로운 이름을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const newName = (e.target as HTMLInputElement).value.trim();
                    if (newName && renameModal) {
                      handleRenameRoom(renameModal.chatId, newName);
                    }
                  }
                  if (e.key === 'Escape') {
                    closeRenameModal();
                  }
                }}
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeRenameModal}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={() => {
                  const newName = renameInputRef.current?.value.trim();
                  console.log('변경 버튼 클릭:', { newName, renameModal });
                  if (newName && renameModal) {
                    handleRenameRoom(renameModal.chatId, newName);
                  }
                }}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition cursor-pointer"
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
