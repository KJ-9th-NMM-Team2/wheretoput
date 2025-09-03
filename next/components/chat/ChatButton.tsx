"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import styles from "./ChatButton.module.scss";

import { api, setAuthToken } from "@/lib/client/api";
import { connectSocket, getSocket } from "@/lib/client/socket";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";

const NEXT_API_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const SOCKET_API_URL = 
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type ChatListItem = {
  chat_room_id: string;
  name: string; // UI 표시용 (룸 이름)
  is_private: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageAt?: string;
  last_read_at: string;
  searchIndex: string; //  검색 전용: 마지막 메시지 전용
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
  tempId?: string;
};

type UserLite = {
  id: string;
  name: string;
  image?: string;
};

export default function ChatButton({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [select, setSelect] = useState<"전체" | "읽지 않음">("전체");
  const [selectedChatId, setselectedChatId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { data: session } = useSession();

  const ts = (s?: string) => {
    if (!s) return -Infinity;
    const t = Date.parse(s.replace(/\s+/g, ""));
    return Number.isNaN(t) ? -Infinity : t;
  };
  const isUnread = (chat: ChatListItem) =>
    ts(chat.lastMessageAt) > ts(chat.last_read_at);
  const byLatest = (a: ChatListItem, b: ChatListItem) =>
    ts(b.lastMessageAt) - ts(a.lastMessageAt);

  const [baseChats, setBaseChats] = useState<ChatListItem[]>([]);
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [messagesByRoom, setMessagesByRoom] = useState<
    Record<string, Message[]>
  >({});

  const selectedMessages: Message[] = selectedChatId
    ? messagesByRoom[selectedChatId] ?? []
    : [];
  const selectedChat = useMemo(() => {
    if (!selectedChatId) return null;
    return baseChats.find(c => c.chat_room_id === selectedChatId) ?? null;
  }, [selectedChatId, baseChats]);
  const [peopleHits, setPeopleHits] = useState<UserLite[]>([]);

  function formatRelativeTime(isoString?: string): string {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const sec = Math.floor(diff / 1000);
    const min = Math.floor(sec / 60);
    const hour = Math.floor(min / 60);
    const day = Math.floor(hour / 24);
    if (sec < 60) return "방금 전";
    if (min < 60) return `${min}분 전`;
    if (hour < 24) return `${hour}시간 전`;
    if (day === 1) return "어제";
    if (day < 7) return `${day}일 전`;
    return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  }

  //  검색은 searchIndex(=lastMessage)만 기준
  const recomputeChats = useCallback(
    (raw: ChatListItem[], q: string, mode: "전체" | "읽지 않음") => {
      const src = mode === "읽지 않음" ? raw.filter(isUnread) : raw;
      const k = q.trim().toLocaleLowerCase("ko-KR");
      if (!k) {
        return [...src]
          .filter((c) => (c.lastMessage ?? "").trim() !== "")
          .sort(byLatest);
      }

      const filtered = src.filter((c) => c.searchIndex.includes(k));
      return filtered.sort(byLatest);
    },
    []
  );

  // 토큰 교환 + 소켓 준비
  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        // 1. 토큰을 받아오는 작업
        const r = await fetch("/api/chat/token", { cache: "no-store" }); // 401 에러
        // 2. response 응답 체크
        if (!r.ok) {
          console.error("token status", r.status);
          return;
        }
        // 여기서 바로 json() 호출하고 다시는 호출하지 않기
        const data = await r.json();
        console.log('Token API response:', data);
        // 토큰 값 가져오기 (안전한 체이닝)
        const token = data?.tokenData?.jti;
        if (!alive || !token) return;
        setToken(token);
        setAuthToken(token);
        connectSocket(token);
      } catch (e) {
        console.error("token error", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open]);

  // 방 목록 로드
  // useEffect(() => {
  //   if (!open || !token) {
  //     console.log("[ROOMS] 스킵 - open:", open, "token:", !!token);
  //     return;
  //   }

  //   (async () => {
  //     const path = "/backend/rooms";
  //     try {
  //       console.log("[ROOMS] GET", path);
  //       const { data } = await api.get("/backend/rooms", {
  //         params: { limit: 1000 },
  //         headers: { Authorization: `Bearer ${token}` },
  //       });

  //       const mapped: ChatListItem[] = (data ?? []).map((r: any) => {
  //         const lastMsg = r.last_message?.content ?? r.lastMessage ?? "";
  //         return {
  //           chat_room_id: r.chat_room_id ?? r.id ?? String(r.room_id ?? ""),
  //           name: r.name ?? "이름 없음",
  //           is_private: Boolean(r.is_private),
  //           lastMessage: lastMsg,
  //           lastMessageAt: r.last_message?.created_at ?? r.lastMessageAt ?? undefined,
  //           last_read_at: r.last_read_at ?? r.lastReadAt ?? "1970-01-01T00:00:00.000Z",
  //           searchIndex: (lastMsg ?? "").toLocaleLowerCase("ko-KR"),
  //         };
  //       });

  //       setBaseChats(mapped);
  //       setChats(recomputeChats(mapped, "", "전체"));
  //       setSelect("전체");
  //       setQuery("");
  //       setselectedChatId(chat.chat_room_id);
  //       console.log("[ROOMS] OK", mapped.length);
  //     } catch (e: any) {
  //       console.error("[ROOMS] FAIL", {
  //         url: path,
  //         status: e?.response?.status,
  //         data: e?.response?.data,
  //         message: e?.message,
  //         tokenExists: !!token,
  //       });
  //     }
  //   })();
  // }, [open, token, recomputeChats]);

  useEffect(() => {
    const bootstrap = async () => {
      const res = await fetch("/api/chat/token", { cache: "no-store" });
      const data = await res.json();
      console.log('토큰 응답:', data);
      const token = data["tokenData"]?.["jti"] || data.token;
      console.log('추출된 토큰:', token);
      setToken(token);
      setAuthToken(token);
      // 이후부터 api.get/post가 자동으로 Authorization 포함
    };
    bootstrap();
  }, []);

  // 테스트용 token 빼놨음
  useEffect(() => {
    if (!open) return;

    const q = query.trim(); //사용자가 채팅창에 검색
    if (!q) {
      setPeopleHits([]);
      return;
    } // 검색창 비어있을시 검색 결과를 빈 배열로 초기화한 뒤 useEffect 실행 종료

    const t = setTimeout(async () => {
      try {
        const { data } = await api.get("http://localhost:3000/api/backend", {
          params: { q, limit: 20 },
        });
        const users = data ?? [];
        const rows: UserLite[] = (users ?? []).map((u: any) => ({
          id: String(u.id),
          name: u.name ?? "이름 없음",
          image: u.image ?? undefined,
        }));
        setPeopleHits(rows.filter((u) => u.id !== currentUserId));
      } catch {
        setPeopleHits([]); // 실패 시 비움
      }
    }, 250);

    return () => clearTimeout(t);
  }, [open, query, currentUserId]);

  // 방 선택 시 join + 히스토리 로드
  useEffect(() => {

    if (!open || !selectedChatId || !token) return;
    const s = connectSocket(token);
    console.log('🚪 FRONTEND JOIN:', selectedChatId);
    s.emit("join", { roomId: selectedChatId });

    let cancelled = false;

    (async () => {
      const { data } = await api.get(
        `${SOCKET_API_URL}/rooms/${selectedChatId}/messages`,
        {
          params: { limit: 50 },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (cancelled) return;
      const history: Message[] = (data?.messages ?? data ?? []).map(
        (m: any) => ({
          id: m.id ?? String(m.message_id),
          roomId: m.roomId ?? String(m.room_id ?? selectedChatId),
          senderId: m.senderId ?? String(m.user_id),
          senderName: m.sender?.name ?? m.user?.name,
          avatarUrl: m.sender?.image ?? m.user?.image,
          content: m.content,
          createdAt: m.createdAt ?? m.created_at,
          status: "read",
        })
      );
      setMessagesByRoom((prev) => ({ ...prev, [selectedChatId]: history }));

      // 읽음 처리 + 목록 last_read_at 갱신
      s.emit("read", { roomId: selectedChatId });
      setBaseChats((prev) => {
        const next = prev.map((c) =>
          c.chat_room_id === selectedChatId
            ? { ...c, last_read_at: new Date().toISOString() }
            : c
        );
        setChats(recomputeChats(next, query, select));
        return next;
      });
    })();

    return () => {
      cancelled = true;
      s.emit("leave", { roomId: selectedChatId });
    };
  }, [open, selectedChatId, token, query, select, recomputeChats]);

  // 팝업 닫힐 때 소켓 정리
  useEffect(() => {
    if (open) return;
    const s = getSocket();
    if (s) s.disconnect();
  }, [open]);

  // 실시간 수신 + ACK + 읽음 이벤트
  useEffect(() => {
    if (!open) return;
    const s = getSocket();
    if (!s) return;

    const onMessage = (m: any) => {
      const msg: Message = {
        id: m.id ?? String(m.message_id),
        roomId: m.roomId ?? String(m.room_id),
        senderId: m.senderId ?? String(m.user_id),
        senderName: m.sender?.name ?? m.user?.name,
        avatarUrl: m.sender?.image ?? m.user?.image,
        content: m.content,
        createdAt: m.createdAt ?? m.created_at,
        status: "sent",
      };

      setMessagesByRoom((prev) => ({
        ...prev,
        [msg.roomId]: [...(prev[msg.roomId] ?? []), msg],
      }));

      setBaseChats((prev) => {
        const updated = prev.map((c) =>
          c.chat_room_id === msg.roomId
            ? {
              ...c,
              lastMessage: msg.content,
              lastMessageAt: msg.createdAt,
              //  수신 시 검색 인덱스도 동기화
              searchIndex: (msg.content ?? "").toLocaleLowerCase("ko-KR"),
            }
            : c
        );
        setChats(recomputeChats(updated, query, select));
        return updated;
      });
    };

    const onAck = (ack: {
      tempId: string;
      realId: string;
      createdAt?: string;
    }) => {
      if (!selectedChatId) return;
      setMessagesByRoom((prev) => {
        const arr = prev[selectedChatId] ?? [];
        const next = arr.map((m) =>
          m.id === ack.tempId
            ? {
              ...m,
              id: ack.realId,
              status: "sent",
              createdAt: ack.createdAt ?? m.createdAt,
              tempId: undefined,
            }
            : m
        );
        return { ...prev, [selectedChatId]: next };
      });
    };

    const onRead = (evt: { roomId: string }) => {
      if (evt.roomId !== selectedChatId) return;
      setMessagesByRoom((prev) => {
        const arr = prev[evt.roomId] ?? [];
        const next = arr.map((m) =>
          m.senderId === currentUserId && m.status !== "read"
            ? { ...m, status: "read" }
            : m
        );
        return { ...prev, [evt.roomId]: next };
      });
    };

    s.on("message", onMessage);
    s.on("message:ack", onAck);
    s.on("read:updated", onRead);

    return () => {
      s.off("message", onMessage);
      s.off("message:ack", onAck);
      s.off("read:updated", onRead);
    };
  }, [open, currentUserId, query, select, recomputeChats, selectedChatId]);

  // 전송
  const onSendMessage = useCallback(
    (roomId: string, content: string) => {
      if (!token) return;
      const now = new Date().toISOString();
      const tempId = `tmp-${Math.random().toString(36).slice(2)}`;
      const tempMsg: Message = {
        id: tempId,
        tempId,
        roomId,
        senderId: currentUserId,
        content,
        createdAt: now,
        status: "sending",
      };

      setMessagesByRoom((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] ?? []), tempMsg],
      }));

      setBaseChats((prev) => {
        const updated = prev.map((c) =>
          c.chat_room_id === roomId
            ? {
              ...c,
              lastMessage: content,
              lastMessageAt: now,
              last_read_at: now,
              //  전송 시 검색 인덱스도 동기화
              searchIndex: (content ?? "").toLocaleLowerCase("ko-KR"),
            }
            : c
        );
        setChats(recomputeChats(updated, query, select));
        return updated;
      });

      const s = getSocket() ?? connectSocket(token);
      console.log('🔵 WEBSOCKET SEND:', { roomId, content, tempId });
      console.log('🔵 SOCKET STATE:', s.connected);
      s.emit("send", { roomId, content, tempId });
    },
    [currentUserId, token, query, select, recomputeChats]
  );

  // 버블/스크롤 유틸
  const hhmm = (iso: string) =>
    new Date(iso).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

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

  function Bubble({ m, showAvatar }: { m: Message; showAvatar: boolean }) {
    const isMine = m.senderId === currentUserId;
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
            {m.avatarUrl ? (
              <img
                src={m.avatarUrl}
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

  // 오토스크롤
  const listRef = useRef<HTMLDivElement | null>(null);
  const userAtBottomRef = useRef(true);

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

  const dayKey = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: "short",
    });

  const groupedByDay = useMemo(() => {
    const acc: Record<string, Message[]> = {};
    for (const m of selectedMessages) {
      const k = dayKey(m.createdAt);
      (acc[k] ||= []).push(m);
    }
    return acc;
  }, [selectedMessages]);

  // 입력 & 전송
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

  // 1:1 시작
  const onStartDirect = useCallback(
    async (otherUserId: string, otherUserName?: string) => {
      if (!token) {
        console.error('토큰이 없습니다');
        return;
      }
      
      // 필터 초기화
      setQuery("");
      setSelect("전체");

      const { data } = await api.post(`${NEXT_API_URL}/api/backend/rooms/direct`, {
        currentUserId: session?.user?.id,
        otherUserId
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const roomId =
        data?.chat_room_id ?? data?.roomId ?? data?.id ?? String(data?.room_id);
      if (!roomId) return;

      setselectedChatId(roomId);

      setBaseChats(prev => {
        const exists = prev.some(c => c.chat_room_id === roomId);
        if (exists) {
          const next = [...prev];
          setChats(recomputeChats(next, "", "전체"));
          return next;
        }
        const next = [
          {
            chat_room_id: roomId,
            name: data?.name ?? otherUserName ?? "새 대화", // 낙관적 이름 주입
            is_private: true,
            lastMessage: "",
            lastMessageAt: new Date().toISOString(),
            last_read_at: "1970-01-01T00:00:00.000Z",
            searchIndex: "",
          },
          ...prev,
        ];
        setChats(recomputeChats(next, "", "전체"));
        return next;
      });
    },
    [recomputeChats, token, session?.user?.id, selectedChatId]
  );


  return (
    <>
      {/* 플로팅 버튼 */}
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
                              onClick={(e) => { e.stopPropagation(); onStartDirect(u.id, u.name); }}
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
