// 채팅방 목록 화면 컴포넌트
// 채팅방 목록과 사용자 검색 결과를 표시

import SearchBar from "./shared/SearchBar";
import { ChatListItem, UserLite } from "../types/chat-types";
import { formatRelativeTime, isUnread, recomputeChats } from "../utils/chat-utils";

interface ChatListViewProps {
  query: string;
  setQuery: (query: string) => void;
  select: "전체" | "읽지 않음";
  setSelect: (select: "전체" | "읽지 않음") => void;
  baseChats: ChatListItem[];
  chats: ChatListItem[];
  setChats: (chats: ChatListItem[]) => void;
  peopleHits: UserLite[];
  onChatSelect: (chatId: string) => void;
  onStartDirect: (userId: string, userName?: string) => void;
}

export default function ChatListView({
  query,
  setQuery,
  select,
  setSelect,
  baseChats,
  chats,
  setChats,
  peopleHits,
  onChatSelect,
  onStartDirect,
}: ChatListViewProps) {
  return (
    <div className="flex flex-col h-full">
      <header className="px-3 py-2 flex items-center justify-between text-xl">
        <b>채팅</b>
      </header>

      {/* 검색 */}
      <SearchBar
        value={query}
        onChange={(q) => {
          setQuery(q);
          setChats(recomputeChats(baseChats, q, select));
        }}
        onClear={() => {
          setQuery("");
          setChats(recomputeChats(baseChats, "", select));
        }}
        placeholder="Messenger 검색"
      />

      {/* 탭 */}
      <div className="flex gap-2 px-3 py-2">
        <button
          onClick={() => {
            setSelect("전체");
            setChats(recomputeChats(baseChats, query, "전체"));
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
            setChats(recomputeChats(baseChats, query, "읽지 않음"));
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
        {query.trim() ? (
          <>
            {/* 사람 섹션 */}
            <div className="px-1 py-2 text-xs text-gray-500">
              사람
            </div>
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
                    <div className="font-medium truncate">
                      {u.name}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* 구분선 */}
            <div className="my-2 border-t border-gray-200" />

            {/* 채팅 섹션 */}
            <div className="px-1 py-2 text-xs text-gray-500">
              채팅
            </div>
            {chats.length === 0 ? (
              <div className="px-2 pb-2 text-sm text-gray-400">
                일치하는 채팅이 없습니다.
              </div>
            ) : (
              chats.map((chat) => {
                const unread = isUnread(chat);
                return (
                  <div
                    key={chat.chat_room_id}
                    onClick={() => onChatSelect(chat.chat_room_id)}
                    className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold">
                        {chat.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate w-40">
                        {chat.lastMessage}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
              return (
                <div
                  key={chat.chat_room_id}
                  onClick={() => onChatSelect(chat.chat_room_id)}
                  className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <div>
                    <div className="font-semibold">{chat.name}</div>
                    <div className="text-sm text-gray-500 truncate w-40">
                      {chat.lastMessage}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
    </div>
  );
}