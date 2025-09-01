"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import styles from "./ChatButton.module.scss";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type ChatListItem = {
  chat_room_id: string;
  name: string;
  is_private: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageAt?: string;
  last_read_at: string;
};

type Message = {
  id: string;
  roomId: string;
  senderId: string;
  senderName?: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
  status?: "sending" | "sent" | "read";
};

//임시 데이터
const INITIAL_CHATS: ChatListItem[] = [
  {
    chat_room_id: "1",
    name: "성진",
    is_private: false,
    lastMessage: "하이",
    lastMessageAt: "2025-08-27T01:30:00.000Z",
    last_read_at: "2025-08-28T01:30:00.000Z",
  },
  {
    chat_room_id: "2",
    name: "상록",
    is_private: false,
    lastMessage: "수고하셨어요",
    lastMessageAt: "2025-08-21T01:30:00.000Z",
    last_read_at: "2025 -08 - 28T01: 30:00.000Z",
  },
  {
    chat_room_id: "3",
    name: "종호",
    is_private: true,
    lastMessage: "안녕하세요",
    lastMessageAt: "2025-08-23T01:30:00.000Z",
    last_read_at: "2025 -08 - 28T01: 30:00.000Z",
  },
  {
    chat_room_id: "4",
    name: "수연",
    is_private: true,
    lastMessage: "머함",
    lastMessageAt: "2025-08-28T01:30:00.000Z",
    last_read_at: "2025 -08 - 25T01: 30:00.000Z",
  },
  {
    chat_room_id: "5",
    name: "준탁",
    is_private: true,
    lastMessage: "가나다라마바사",
    lastMessageAt: "2025-08-25T01:30:00.000Z",
    last_read_at: "2025 -08 - 24T01: 30:00.000Z",
  },
];

export default function ChatButton() {
  const [open, setOpen] = useState(false); // 팝업창 on off
  const [select, setSelect] = useState<"전체" | "읽지 않음">("전체"); // 필터
  const [selectedChatId, setselectedChatId] = useState<string | null>(null); // null이면 리스트, string이면 방
  const [query, setQuery] = useState("");

  const ts = (s?: string) => {
    if (!s) return -Infinity;
    const t = Date.parse(s.replace(/\s+/g, ""));
    return Number.isNaN(t) ? -Infinity : t;
  };

  const [baseChats, setBaseChats] = useState<ChatListItem[]>(INITIAL_CHATS); // 데이터를 baseChats에 저장
  const [chats, setChats] = useState<ChatListItem[]>( // 데이터를 chats에 최신순으로 정렬 후 저장
    [...INITIAL_CHATS].sort((a, b) => ts(b.lastMessageAt) - ts(a.lastMessageAt))
  );

  // 시간 계산 함수
  function formatRelativeTime(isoString?: string): string {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "방금 전";
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    if (diffDay === 1) return "어제";
    if (diffDay < 7) return `${diffDay}일 전`;

    // 일주일 이상은 날짜로 표시
    return date.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    });
  }
  const selectedChat =
    chats.find((c) => c.chat_room_id === selectedChatId) ?? null; // 사용자가 선택한 채팅방

  const isUnread = (
    chat: ChatListItem // 읽지 않음 판별
  ) => ts(chat.lastMessageAt) > ts(chat.last_read_at);

  const byLatest = (
    a: ChatListItem,
    b: ChatListItem // 필터 에서 사용
  ) => ts(b.lastMessageAt) - ts(a.lastMessageAt);

  // 검색 함수
  const applySearch = (q: string) => {
    const qLower = q.trim().toLowerCase();
    const source = getSourceBySelect();

    const filtered = qLower
      ? source.filter(
          (c) =>
            (c.name?.toLowerCase().includes(qLower) ?? false) ||
            (c.lastMessage?.toLowerCase().includes(qLower) ?? false)
        )
      : source; // 빈 검색어면 전체(혹은 읽지 않음) 그대로

    setChats([...filtered].sort(byLatest));
  };

  const getSourceBySelect = () => {
    if (select === "읽지 않음") return baseChats.filter(isUnread);
    return baseChats;
  };

  /* 
    채팅 리스트 함수들
    -------------------------------------------------------------------------------------------
    채팅 화면 함수들
    */

  // 로그인한 사용자의 ID 저장 ( 내가 보낸 메시지인지,상대방이 보낸 메시지인지 )
  const currentUserId = "me";

  // 메시지를 튜플 형태로 저장함 (예 : 안녕하세요 : [방번호,보낸사람, 보낸시간 등등])
  const seeded = useMemo(() => {
    const entries = INITIAL_CHATS.map((c) => {
      const iso = c.lastMessageAt ?? new Date().toISOString();
      const msg: Message = {
        id: `m-${c.chat_room_id}-1`,
        roomId: c.chat_room_id,
        senderId: `user:${c.chat_room_id}`, // 상대방 가정
        senderName: c.name,
        avatarUrl: `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(
          c.name
        )}`,
        content: c.lastMessage ?? "",
        createdAt: iso,
        status: "read",
      };
      return [c.chat_room_id, [msg]];
    });
    return Object.fromEntries(entries) as Record<string, Message[]>;
  }, []);

  const [messagesByRoom, setMessagesByRoom] =
    useState<Record<string, Message[]>>(seeded);

  const selectedMessages: Message[] = selectedChatId
    ? messagesByRoom[selectedChatId] ?? []
    : [];

  const onSendMessage = useCallback(
    (roomId: string, content: string) => {
      const now = new Date().toISOString();
      const tempMsg: Message = {
        id: `tmp-${Math.random().toString(36).slice(2)}`,
        roomId,
        senderId: currentUserId,
        content,
        createdAt: now,
        status: "sent", // 데모: 바로 sent. 실제론 'sending' 후 ack에서 'sent'로
      };

      // 1) 채팅창에 낙관적으로 메시지 추가
      setMessagesByRoom((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] ?? []), tempMsg],
      }));

      // 2) 방 목록 메타 갱신 (lastMessage / lastMessageAt / last_read_at)
      const updatedBase = baseChats.map((c) =>
        c.chat_room_id === roomId
          ? {
              ...c,
              lastMessage: content,
              lastMessageAt: now,
              last_read_at: now,
            }
          : c
      );
      setBaseChats(updatedBase);

      // 3) 현재 탭(전체/읽지 않음)에 맞춰 목록 재정렬
      const source =
        select === "읽지 않음" ? updatedBase.filter(isUnread) : updatedBase;
      setChats([...source].sort(byLatest));
    },
    [baseChats, select, currentUserId]
  );

  const hhmm = (iso: string) =>
    new Date(iso).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  // [추가] 연속 메시지에서 아바타/이름 중복 줄이기
  const shouldShowAvatar = (arr: Message[], idx: number) => {
    if (idx === 0) return true;
    const prev = arr[idx - 1];
    const cur = arr[idx];
    const sameSender = prev.senderId === cur.senderId;
    const within3m =
      Math.abs(
        new Date(cur.createdAt).getTime() - new Date(prev.createdAt).getTime()
      ) <
      3 * 60 * 1000;
    return !(sameSender && within3m);
  };

  // [추가] 단일 메시지 버블
  function Bubble({ m, showAvatar }: { m: Message; showAvatar: boolean }) {
    const isMine = m.senderId === currentUserId;
    return (
      <div
        className={`flex items-end gap-2 ${
          isMine ? "justify-end" : "justify-start"
        }`}
      >
        {!isMine && (
          <div
            className={`h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 ${
              showAvatar ? "opacity-100" : "opacity-0"
            }`}
          >
            {m.avatarUrl ? (
              <img
                src={m.avatarUrl}
                alt={m.senderName ?? "avatar"}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
        )}

        <div
          className={`max-w-[75%] ${
            isMine ? "items-end" : "items-start"
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

          <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
            <span>{hhmm(m.createdAt)}</span>
            {isMine && m.status === "sending" && <span>전송 중</span>}
            {isMine && m.status === "sent" && <span>보냄</span>}
            {isMine && m.status === "read" && <span>읽음</span>}
          </div>
        </div>

        {isMine && <div className="h-8 w-8 flex-shrink-0" />}
      </div>
    );
  }

  // [추가] 오토스크롤 ref
  const listRef = useRef<HTMLDivElement | null>(null);

  // [추가] 새 메시지/방 전환 시 맨 아래로
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [selectedMessages.length, selectedChatId]);

  // [선택] 날짜 헤더 키
  const dayKey = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: "short",
    });

  // [선택] 날짜별 그룹핑
  const groupedByDay = useMemo(() => {
    const acc: Record<string, Message[]> = {};
    for (const m of selectedMessages) {
      const k = dayKey(m.createdAt);
      (acc[k] ||= []).push(m);
    }
    return acc;
  }, [selectedMessages]);
  const [text, setText] = useState("");

  const send = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !selectedChatId) return;
    onSendMessage(selectedChatId, trimmed);
    setText("");
  }, [text, selectedChatId, onSendMessage]);

  const onEditorKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    e
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* 채팅 버튼 */}
      <motion.button
        className={styles.button}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
        onClick={() =>
          setOpen((prev) => {
            const next = !prev;
            if (next) {
              setSelect("전체");
              setChats(
                [...baseChats].sort(
                  (a, b) => ts(b.lastMessageAt) - ts(a.lastMessageAt)
                )
              );
            }
            return next;
          })
        }
      >
        💬
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-popup"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ transformOrigin: "100% 100%" }}
            className="fixed right-6 bottom-24 z-[1000] w-[360px] h-[420px] bg-white text-black rounded-xl border border-gray-300 shadow-lg flex flex-col overflow-hidden"
          >
            {/* 내부 화면 전환(list ↔ room) */}
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
                        applySearch(q);
                      }}
                      placeholder="Messenger 검색"
                      className="bg-transparent outline-none w-full text-[15px] placeholder:text-[#9aa4b2]"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("");
                          applySearch("");
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
                        const all = [...baseChats].sort(byLatest);
                        setChats(all);
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
                        setselectedChatId(null);
                        const unread = baseChats.filter(isUnread);
                        const sorted = [...unread].sort(byLatest);
                        setChats(sorted);
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
                    {chats.map((chat) => {
                      const unread = isUnread(chat);
                      return (
                        <div
                          key={chat.chat_room_id}
                          onClick={() => setselectedChatId(chat.chat_room_id)}
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
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
