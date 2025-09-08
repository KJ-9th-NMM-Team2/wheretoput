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
  onStartDirect: (userId: string, userName?: string) => void;
  currentUserId: string | null;
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
  onStartDirect,
  currentUserId,
}: ChatListViewProps) {
  const [showUserList, setShowUserList] = useState(false);
  const [allUsers, setAllUsers] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    chatId: string;
    x: number;
    y: number;
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    chatId: string;
    chatName: string;
  } | null>(null);

  // 유저 목록 로드
  const loadAllUsers = async () => {
    setLoading(true);
    try {
      console.log("🥶 유저 목록 로드 API 호출 전 api/backend NEXT 서버");
      const { data } = await api.get("api/backend", {
        params: { limit: 100 }, // 모든 유저 가져오기
      });
      console.log("🥶 유저 목록 로드 API 호출 후");
      const users = data ?? [];
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
    }
    setShowUserList(!showUserList);
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

  // 삭제 모달 열기
  const openDeleteModal = (chatId: string) => {
    closeContextMenu();
    const chat = baseChats.find((c) => c.chat_room_id === chatId);
    if (chat) {
      setDeleteModal({
        chatId,
        chatName: chat.name || "이름 없는 채팅방",
      });
    }
  };

  // 삭제 모달 닫기
  const closeDeleteModal = () => {
    setDeleteModal(null);
  };

  // 채팅방 완전 삭제 실행
  const handleDeleteRoom = async (roomId: string) => {
    closeDeleteModal();

    setDeleting(roomId);
    try {
      await api.delete(
        `http://localhost:3001/rooms/${roomId}/delete-completely`
      );

      // 채팅방 목록에서 제거
      const updatedChats = baseChats.filter(
        (chat) => chat.chat_room_id !== roomId
      );
      setBaseChats(updatedChats);
      setChats(recomputeChats(updatedChats, query, select, currentUserId));
    } catch (error: any) {
      console.error("채팅방 삭제 실패:", error);
      const errorMsg =
        error.response?.data?.message || "채팅방 삭제에 실패했습니다.";
      alert(`삭제 실패: ${errorMsg}`);
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
          className={`px-3 py-1 text-white text-sm rounded-lg transition cursor-pointer ${
            showUserList ? "bg-orange-600" : "bg-orange-500 hover:bg-orange-600"
          }`}
          aria-label="유저 목록"
        >
          👥
        </button>
      </header>

      {/* 검색 */}
      <SearchBar
        value={query}
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
      <div className="flex gap-2 px-3 py-2">
        <button
          onClick={() => {
            setSelect("전체");
            setChats(recomputeChats(baseChats, query, "전체", currentUserId));
          }}
          className={`px-3 py-2 rounded-xl transition cursor-pointer ${
            select === "전체"
              ? "bg-gray-200 text-blue-500"
              : "bg-transparent hover:bg-gray-200"
          }`}
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
          className={`px-3 py-2 rounded-xl transition cursor-pointer ${
            select === "읽지 않음"
              ? "bg-gray-200 text-blue-500"
              : "bg-transparent hover:bg-gray-200"
          }`}
        >
          읽지 않음
        </button>
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
              allUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    onStartDirect(user.id, user.name);
                    setShowUserList(false); // 유저 목록 닫기
                  }}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
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
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{user.name}</div>
                  </div>
                  <div className="text-xs text-orange-500 opacity-75">💬</div>
                </div>
              ))
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartDirect(u.id, u.name);
                  }}
                  className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
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
                    className={`flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg cursor-pointer ${
                      isDeleting ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-semibold">{chat.name}</div>
                      <div className="text-sm text-gray-500 truncate w-40">
                        {chat.lastMessage}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDeleting && <span className="text-xs">⏳</span>}
                      {unread && (
                        <span className="w-3 h-3 rounded-full bg-orange-500" />
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
                  className={`flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg cursor-pointer ${
                    isDeleting ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-semibold">{chat.name}</div>
                    <div className="text-sm text-gray-500 truncate w-40">
                      {chat.lastMessage}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDeleting && <span className="text-xs">⏳</span>}
                    {unread && (
                      <span className="w-3 h-3 rounded-full bg-orange-500" />
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
            onClick={() => openDeleteModal(contextMenu.chatId)}
            disabled={deleting === contextMenu.chatId}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            채팅방 삭제
          </button>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                채팅방 삭제
              </h3>
              <p className="text-gray-600">
                "<span className="font-medium">{deleteModal.chatName}</span>"
                채팅방과 모든 메시지를 완전히 삭제하시겠습니까?
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteRoom(deleteModal.chatId)}
                disabled={deleting === deleteModal.chatId}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting === deleteModal.chatId ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
