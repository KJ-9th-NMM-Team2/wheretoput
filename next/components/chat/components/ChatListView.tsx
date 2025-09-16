// 채팅방 목록 화면 컴포넌트
// 채팅방 목록과 사용자 검색 결과를 표시
// 유저 목록 버튼

import { useState, useEffect } from "react";
import SearchBar from "./shared/SearchBar";
import { ChatListItem, UserLite } from "../types/chat-types";
import {
  formatRelativeTime,
  isUnread,
  recomputeChats,
} from "../utils/chat-utils";
import { api } from "@/lib/client/api";

interface ChatListViewProps {
  query: string;
  setQuery: (query: string) => void;
  select: "전체" | "읽지 않음";
  setSelect: (select: "전체" | "읽지 않음") => void;
  baseChats: ChatListItem[];
  chats: ChatListItem[];
  setChats: (chats: ChatListItem[]) => void;
  setBaseChats: (chats: ChatListItem[]) => void;
  peopleHits: UserLite[];
  onChatSelect: (chatId: string) => void;
  currentUserId: string | null;
  onChatFocus?: (isFocused: boolean) => void;
}

export default function ChatListView({
  query,
  setQuery,
  select,
  setSelect,
  baseChats,
  chats,
  setChats,
  setBaseChats,
  peopleHits,
  onChatSelect,
  currentUserId,
  onChatFocus,
}: ChatListViewProps) {
  const [showUserList, setShowUserList] = useState(false);
  const [allUsers, setAllUsers] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    chatId: string;
    x: number;
    y: number;
  } | null>(null);
  const [leaveModal, setLeaveModal] = useState<{
    chatId: string;
    chatName: string;
  } | null>(null);
  const [renameModal, setRenameModal] = useState<{
    chatId: string;
    chatName: string;
  } | null>(null);

  // 유저 목록 로드
  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("api/backend", {
        params: { limit: 100 }, // 모든 유저 가져오기
      });
      const users = data.data ?? [];
      const rows: UserLite[] = (users ?? []).map((u: any) => ({
        id: String(u.id),
        name: u.name ?? "이름 없음",
        image: u.image ?? undefined,
      }));
      // 현재 사용자는 제외
      const filteredUsers = rows.filter((user) => user.id !== currentUserId);
      setAllUsers(filteredUsers);
    } catch (error) {
      console.error("유저 목록 로드 실패:", error);
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // 유저 목록 버튼 클릭 시
  const handleUserListClick = () => {
    if (!showUserList) {
      loadAllUsers();
      setSelectedUserIds([]); // 선택 초기화
    }
    setShowUserList(!showUserList);
  };

  // 유저 선택 토글
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // 그룹 채팅방 생성
  const createGroupChatRoom = async () => {
    if (selectedUserIds.length === 0) return;

    try {
      setLoading(true);

      const response = await api.post(`${process.env.NEXT_PUBLIC_API_URL}/rooms/group`, {
        participantIds: selectedUserIds,
      });

      const createdRoom = response.data;
      console.log('그룹 채팅방 생성 성공:', createdRoom);

      // 생성된 채팅방을 baseChats에 추가
      if (createdRoom?.chat_room_id) {
        const newChatItem = {
          chat_room_id: createdRoom.chat_room_id,
          name: createdRoom.name || "새 채팅방",
          is_private: createdRoom.is_private || true,
          lastMessage: "",
          lastMessageAt: undefined,
          last_read_at: new Date().toISOString(),
          searchIndex: "",
        };

        // baseChats에 새 채팅방 추가
        const updatedChats = [newChatItem, ...baseChats];
        setBaseChats(updatedChats);
        setChats(recomputeChats(updatedChats, query, select, currentUserId));

        // 생성된 채팅방으로 이동
        onChatSelect(createdRoom.chat_room_id);
        setShowUserList(false); // 유저 목록 닫기
        setSelectedUserIds([]); // 선택 초기화
      }
    } catch (error: any) {
      console.error('그룹 채팅방 생성 실패:', error);
      const errorMsg = error.response?.data?.message || '그룹 채팅방 생성에 실패했습니다.';
      alert(`생성 실패: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

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

  // 나가기 모달 열기
  const openLeaveModal = (chatId: string) => {
    closeContextMenu();
    const chat = baseChats.find((c) => c.chat_room_id === chatId);
    if (chat) {
      setLeaveModal({
        chatId,
        chatName: chat.name || "이름 없는 채팅방",
      });
    }
  };

  // 나가기 모달 닫기
  const closeLeaveModal = () => {
    setLeaveModal(null);
  };

  // 이름 변경 모달 열기
  const openRenameModal = (chatId: string) => {
    closeContextMenu();
    const chat = baseChats.find((c) => c.chat_room_id === chatId);
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
      setChats(recomputeChats(updatedChats, query, select, currentUserId));

      closeRenameModal();
    } catch (error: any) {
      console.error("이름 변경 실패:", error);
      const errorMsg =
        error.response?.data?.message || "이름 변경에 실패했습니다.";
      alert(`변경 실패: ${errorMsg}`);
    }
  };

  // 채팅방 나가기 실행
  const handleLeaveRoom = async (roomId: string) => {
    closeLeaveModal();

    setDeleting(roomId);
    try {
      await api.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/rooms/${roomId}/leave`
      );

      // 채팅방 목록에서 제거
      const updatedChats = baseChats.filter(
        (chat) => chat.chat_room_id !== roomId
      );
      setBaseChats(updatedChats);
      setChats(recomputeChats(updatedChats, query, select, currentUserId));
    } catch (error: any) {
      console.error("채팅방 나가기 실패:", error);
      const errorMsg =
        error.response?.data?.message || "채팅방 나가기에 실패했습니다.";
      alert(`나가기 실패: ${errorMsg}`);
    } finally {
      setDeleting(null);
    }
  };

  // 클릭 시 컨텍스트 메뉴 닫기
  useEffect(() => {
    const handleClick = () => closeContextMenu();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <header className="px-3 py-2 flex items-center justify-between text-xl">
        <b>채팅</b>
        <button
          onClick={handleUserListClick}
          className={`
            text-md font-medium leading-normal px-3 py-1 rounded-2xl transition-all duration-300
            hover:scale-105 active:scale-95 shadow-md hover:shadow-lg cursor-pointer
            flex items-center justify-center
            ${showUserList
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
              : 'text-gray-700 hover:text-blue-700 hover:bg-white hover:border-blue-300 dark:text-gray-200 dark:hover:text-blue-300 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
            }
          `}
          aria-label="유저 목록"
        >
          👥
        </button>
      </header>

      {/* 검색 */}
      <SearchBar
        value={query}
        onFocus={() => onChatFocus?.(true)}
        onBlur={() => onChatFocus?.(false)}
        onChange={(q) => {
          setQuery(q);
          setChats(recomputeChats(baseChats, q, select, currentUserId));
        }}
        onClear={() => {
          setQuery("");
          setChats(recomputeChats(baseChats, "", select, currentUserId));
        }}
        placeholder="Messenger 검색"
      />

      {/* 탭 */}
      <div className="flex gap-2 px-3 py-2 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelect("전체");
              setChats(recomputeChats(baseChats, query, "전체", currentUserId));
            }}
            className={`
              text-md font-medium leading-normal px-3 py-2 rounded-2xl transition-all duration-300
              active:scale-95 shadow-md hover:shadow-lg cursor-pointer
              ${select === "전체"
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                : 'text-gray-700 hover:text-blue-700 hover:bg-white hover:border-blue-300 dark:text-gray-200 dark:hover:text-blue-300 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
              }
            `}
          >
            전체
          </button>

          <button
            onClick={() => {
              setSelect("읽지 않음");
              setChats(
                recomputeChats(baseChats, query, "읽지 않음", currentUserId)
              );
            }}
            className={`
              text-md font-medium leading-normal px-3 py-2 rounded-2xl transition-all duration-300
              active:scale-95 shadow-md hover:shadow-lg cursor-pointer
              ${select === "읽지 않음"
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                : 'text-gray-700 hover:text-blue-700 hover:bg-white hover:border-blue-300 dark:text-gray-200 dark:hover:text-blue-300 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
              }
            `}
          >
            읽지 않음
          </button>
        </div>

        {showUserList && (
          <button
            className={`
              text-md font-medium leading-normal px-3 py-2 rounded-2xl transition-all duration-300
              hover:scale-105 active:scale-95 shadow-md hover:shadow-lg
              ${selectedUserIds.length > 0 && !loading
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white cursor-pointer'
                : 'text-gray-700 bg-gray-200 cursor-not-allowed border border-gray-200 dark:border-gray-600'
              }
            `}
            disabled={selectedUserIds.length === 0 || loading}
            onClick={createGroupChatRoom}
          >
            {loading ? "생성 중..." : `만들기 ${selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ""}`}
          </button>
        )}
      </div>

      {/* 리스트 */}
      <div className="flex-1 px-3 pb-2 overflow-y-auto">
        {showUserList ? (
          // 유저 목록 화면
          <div>
            <div className="px-1 py-2 text-xs text-gray-500 flex items-center justify-between">
              <span>모든 유저</span>
              {loading && <span>로딩 중...</span>}
            </div>
            {allUsers.length === 0 && !loading ? (
              <div className="px-2 pb-2 text-sm text-gray-400">
                유저가 없습니다.
              </div>
            ) : (
              allUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected
                      ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200"
                      : "hover:bg-gray-100 border-2 border-transparent"
                      }`}
                  >
                    {/* 체크박스 */}
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-500"
                      : "border-gray-300 hover:border-gray-400"
                      }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* 프로필 이미지 */}
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                          👤
                        </div>
                      )}
                    </div>

                    {/* 사용자 이름 */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${isSelected ? "text-blue-700" : "text-gray-900"
                        }`}>
                        {user.name}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : query.trim() ? (
          <>
            {/* 사람 섹션 */}
            <div className="px-1 py-2 text-xs text-gray-500">사람</div>
            {peopleHits.length === 0 ? (
              <div className="px-2 pb-2 text-sm text-gray-400">
                일치하는 사람이 없습니다.
              </div>
            ) : (
              peopleHits.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200">
                      {u.image ? (
                        <img
                          src={u.image}
                          alt={u.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="font-medium truncate">{u.name}</div>
                  </div>
                </div>
              ))
            )}

            {/* 구분선 */}
            <div className="my-2 border-t border-gray-200" />

            {/* 채팅 섹션 */}
            <div className="px-1 py-2 text-xs text-gray-500">채팅</div>
            {chats.length === 0 ? (
              <div className="px-2 pb-2 text-sm text-gray-400">
                일치하는 채팅이 없습니다.
              </div>
            ) : (
              chats.map((chat) => {
                const unread = isUnread(chat, currentUserId);
                const isDeleting = deleting === chat.chat_room_id;
                return (
                  <div
                    key={chat.chat_room_id}
                    onClick={() => onChatSelect(chat.chat_room_id)}
                    onContextMenu={(e) =>
                      handleContextMenu(e, chat.chat_room_id)
                    }
                    className={`flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg cursor-pointer ${isDeleting ? "opacity-50 pointer-events-none" : ""
                      }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{chat.name}</div>
                      <div className="text-sm text-gray-500 truncate w-40">
                        {chat.lastMessage}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDeleting && <span className="text-xs">⏳</span>}
                      {unread && (
                        <span className="w-3 h-3 rounded-full bg-blue-500" />
                      )}
                      <div className="text-xs text-gray-400">
                        {formatRelativeTime(chat.lastMessageAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        ) : (
          // 쿼리 없으면 기존 채팅 목록
          <>
            {chats.map((chat) => {
              const unread = isUnread(chat);
              const isDeleting = deleting === chat.chat_room_id;
              return (
                <div
                  key={chat.chat_room_id}
                  onClick={() => onChatSelect(chat.chat_room_id)}
                  onContextMenu={(e) => handleContextMenu(e, chat.chat_room_id)}
                  className={`flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg cursor-pointer ${isDeleting ? "opacity-50 pointer-events-none" : ""
                    }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{chat.name}</div>
                    <div className="text-sm text-gray-500 truncate w-40">
                      {chat.lastMessage}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDeleting && <span className="text-xs">⏳</span>}
                    {unread && (
                      <span className="w-3 h-3 rounded-full bg-blue-500" />
                    )}
                    <div className="text-xs text-gray-400">
                      {formatRelativeTime(chat.lastMessageAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]"
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
          <button
            onClick={() => openLeaveModal(contextMenu.chatId)}
            disabled={deleting === contextMenu.chatId}
            className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            채팅방 나가기
          </button>
        </div>
      )}

      {/* 나가기 확인 모달 */}
      {leaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && leaveModal) {
              handleLeaveRoom(leaveModal.chatId);
            }
            if (e.key === 'Escape') {
              closeLeaveModal();
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                채팅방 나가기
              </h3>
              <p className="text-gray-600">
                "<span className="font-medium">{leaveModal.chatName}</span>"
                채팅방에서 나가시겠습니까?
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeLeaveModal}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                취소
              </button>
              <button
                onClick={() => handleLeaveRoom(leaveModal.chatId)}
                disabled={deleting === leaveModal.chatId}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                autoFocus
              >
                {deleting === leaveModal.chatId ? "나가는 중..." : "나가기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이름 변경 모달 */}
      {renameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                채팅방 이름 변경
              </h3>
              <p className="text-gray-600 mb-4">
                "<span className="font-medium">{renameModal.chatName}</span>" 의 채팅방 이름을 변경합니다.
              </p>
              <input
                type="text"
                defaultValue={renameModal.chatName}
                placeholder="새로운 이름을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                  const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                  const newName = input?.value.trim();
                  if (newName && renameModal) {
                    handleRenameRoom(renameModal.chatId, newName);
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition cursor-pointer"
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
