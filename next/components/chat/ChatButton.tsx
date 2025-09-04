"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import styles from "./ChatButton.module.scss";
import { AnimatePresence, motion } from "framer-motion";

// 분리된 훅들과 유틸들 import
import { useChatConnection } from "./hooks/useChatConnection";
import { useChatRooms } from "./hooks/useChatRooms";
import { useChatMessages } from "./hooks/useChatMessages";
import { useUserSearch } from "./hooks/useUserSearch";
import { 
  formatRelativeTime, 
  isUnread, 
  shouldShowAvatar, 
  shouldShowTimestamp,
  recomputeChats 
} from "./utils/chat-utils";
import { ChatListItem, Message } from "./types/chat-types";

export default function ChatButton({
  currentUserId,
}: {
  currentUserId: string | null;
}) {
  const { data: session } = useSession();
  if (!currentUserId) return null;
  
  const [open, setOpen] = useState(false);
  const [select, setSelect] = useState<"전체" | "읽지 않음">("전체");
  const [selectedChatId, setselectedChatId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // 분리된 훅들 사용
  const { token } = useChatConnection(open);
  
  const { baseChats, chats, setChats, onStartDirect, updateChatRoom } = useChatRooms(
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


  function Bubble({
    m,
    showAvatar,
    showTimestamp,
  }: {
    m: Message;
    showAvatar: boolean;
    showTimestamp: boolean;
  }) {
    const isMine = String(m.senderId) === String(currentUserId);

    return (
      <div
        className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"
          }`}
      >
        {!isMine && (
          <div
            className={`h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 ${showAvatar ? "opacity-100" : "opacity-0"
              }`}
          >
            {m.senderImage ? (
              <img
                src={m.senderImage}
                alt={m.senderName ?? "avatar"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : null}
          </div>
        )}

        <div
          className={`max-w-[75%] ${isMine ? "items-end" : "items-start"
            } flex flex-col`}
        >
          {!isMine && showAvatar && m.senderName ? (
            <span className="text-[11px] text-gray-400 pl-1 mb-0.5">
              {m.senderName}
            </span>
          ) : null}

          <div
            className={[
              "px-3 py-2 rounded-2xl whitespace-pre-wrap break-words",
              isMine
                ? "bg-orange-500 text-white rounded-br-sm"
                : "bg-gray-100 text-gray-900 rounded-bl-sm",
            ].join(" ")}
          >
            {m.content}
          </div>

          {showTimestamp && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
              <span>{new Date(m.createdAt).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit", 
                hour12: false,
              })}</span>
              {isMine && m.status === "sending" && <span>전송 중</span>}
              {isMine && m.status === "sent" && <span>보냄</span>}
              {isMine && m.status === "read" && <span>읽음</span>}
            </div>
          )}
        </div>

        {isMine && <div className="h-8 w-8 flex-shrink-0" />}
      </div>
    );
  }

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

  useEffect(() => {
    const el = listRef.current;
    if (el && userAtBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [selectedMessages.length, selectedChatId]);

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

  // 채팅방에 처음 들어갈 때 맨 아래로 스크롤
  useEffect(() => {
    if (selectedChatId && selectedMessages.length > 0) {
      const el = listRef.current;
      if (el) {
        // 강제로 맨 아래로 스크롤
        setTimeout(() => {
          el.scrollTop = el.scrollHeight;
          userAtBottomRef.current = true;
        }, 100);
      }
    }
  }, [selectedChatId]);

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
      {/* 플로팅 버튼 */}
      <motion.button
        ref={buttonRef}
        className={styles.button}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
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
        aria-label="채팅 열기"
      >
        💬
      </motion.button>

      <AnimatePresence>
        {open && (
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
                  className="flex flex-col h-full"
                >
                  <header className="px-3 py-2 flex items-center justify-between text-xl">
                    <b>채팅</b>
                  </header>

                  {/* 검색 */}
                  <form
                    onSubmit={(e) => e.preventDefault()}
                    className="m-2 flex items-center rounded-full bg-[rgba(255,255,255,1)] px-4 py-2 shadow-sm border border-gray-300 focus-within:border-blue-400"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      className="mr-2 opacity-70 text-black-500"
                    >
                      <path
                        d="M21 20l-4.35-4.35m1.1-4.4a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      value={query}
                      onChange={(e) => {
                        const q = e.target.value;
                        setQuery(q);
                        setChats(recomputeChats(baseChats, q, select));
                      }}
                      placeholder="Messenger 검색"
                      className="bg-transparent outline-none w-full text-[15px] placeholder:text-[#9aa4b2]"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("");
                          setChats(recomputeChats(baseChats, "", select));
                        }}
                        className="ml-2 text-sm text-gray-500 hover:text-gray-700"
                        aria-label="검색어 지우기"
                      >
                        ✕
                      </button>
                    )}
                  </form>

                  {/* 탭 */}
                  <div className="flex gap-2 px-3 py-2">
                    <button
                      onClick={() => {
                        setSelect("전체");
                        setselectedChatId(null);
                        setChats(recomputeChats(baseChats, query, "전체"));
                      }}
                      className={`px-3 py-2 rounded-xl transition cursor-pointer ${select === "전체"
                          ? "bg-gray-200 text-blue-500"
                          : "bg-transparent hover:bg-gray-200"
                        }`}
                    >
                      전체
                    </button>

                    <button
                      onClick={() => {
                        setSelect("읽지 않음");
                        setselectedChatId(null);
                        setChats(recomputeChats(baseChats, query, "읽지 않음"));
                      }}
                      className={`px-3 py-2 rounded-xl transition cursor-pointer ${select === "읽지 않음"
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
                                handleStartDirect(u.id, u.name);
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
                                onClick={() =>
                                  setselectedChatId(chat.chat_room_id)
                                }
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
                              onClick={() =>
                                setselectedChatId(chat.chat_room_id)
                              }
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
                </motion.div>
              ) : (
                // 채팅방 화면
                <motion.div
                  key="room"
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeInOut" }}
                  className="flex flex-col h-full"
                >
                  <header className="px-3 py-2 flex items-center justify-between text-xl">
                    <div className="flex min-w-0 items-center gap-2">
                      <b className="px-2 truncate">
                        {selectedChat?.name ?? "채팅"}
                      </b>
                    </div>
                    <button
                      onClick={() => setselectedChatId(null)}
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
                          <Bubble
                            key={m.id}
                            m={m}
                            showAvatar={shouldShowAvatar(arr, i)}
                            showTimestamp={shouldShowTimestamp(arr, i)}
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
                        disabled={!text.trim() || !selectedChatId}
                        className={`px-3 py-2 rounded-lg text-white cursor-pointer ${text.trim()
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "bg-gray-300 cursor-not-allowed"
                          }`}
                      >
                        전송
                      </button>
                    </div>
                  </footer>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
