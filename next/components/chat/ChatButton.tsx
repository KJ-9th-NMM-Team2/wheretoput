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

<<<<<<< HEAD
export default function ChatButton({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const [tokenData, setTokenData] = useState<{token: string; userId: string} | null>(null);
  const [select, setSelect] = useState<"전체" | "읽지 않음">("전체");
  const [selectedChatId, setselectedChatId] = useState<string | null>(null);
=======
export default function ChatButton() {
  const [open, setOpen] = useState(false); // 팝업창 on off
  const [select, setSelect] = useState<"전체" | "읽지 않음">("전체"); // 필터
  const [selectedChatId, setselectedChatId] = useState<string | null>(null); // null이면 리스트, string이면 방
>>>>>>> 8793f175028584323bf4c4cafb907debcbc664af
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

<<<<<<< HEAD
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
        const tokenData = await r.json();
        if (!alive) return;
        setTokenData(tokenData);
        setAuthToken(tokenData.token);
        connectSocket(tokenData.token);
      } catch (e) {
        console.error("token error", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open]);

  // 방 목록 로드
  useEffect(() => {
    if (!open || !tokenData) {
      return;
    }

    (async () => {
      const path = "/backend/rooms";
      try {
        console.log("[ROOMS] GET", path);
        const { data } = await api.get("/backend/rooms", {
          params: { limit: 1000 },
          headers: { Authorization: `Bearer ${tokenData.token}` },
        });

        const mapped: ChatListItem[] = (data ?? []).map((r: any) => {
          const lastMsg = r.last_message?.content ?? r.lastMessage ?? "";
          return {
            chat_room_id: r.chat_room_id ?? r.id ?? String(r.room_id ?? ""),
            name: r.name ?? "이름 없음",
            is_private: Boolean(r.is_private),
            lastMessage: lastMsg,
            lastMessageAt: r.last_message?.created_at ?? r.lastMessageAt ?? undefined,
            last_read_at: r.last_read_at ?? r.lastReadAt ?? "1970-01-01T00:00:00.000Z",
            searchIndex: (lastMsg ?? "").toLocaleLowerCase("ko-KR"),
          };
        });

        setBaseChats(mapped);
        setChats(recomputeChats(mapped, "", "전체"));
        setSelect("전체");
        setQuery("");
        console.log("[ROOMS] OK", mapped.length);
      } catch (e: any) {
        console.error("[ROOMS] FAIL", {
          url: path,
          status: e?.response?.status,
          data: e?.response?.data,
          message: e?.message,
          tokenExists: !!tokenData.token,
        });
      }
    })();
  }, [open, tokenData, recomputeChats]);

  useEffect(() => {
    const bootstrap = async () => {
      const res = await fetch("/api/chat/token", { cache: "no-store" });
      // token: newToken,
      // userId: token.id
      const { token } = await res.json();
      setAuthToken(token);
      // 이후부터 api.get/post가 자동으로 Authorization 포함
    };
    bootstrap();
=======
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
>>>>>>> 8793f175028584323bf4c4cafb907debcbc664af
  }, []);

  const [messagesByRoom, setMessagesByRoom] =
    useState<Record<string, Message[]>>(seeded);

  const selectedMessages: Message[] = selectedChatId
    ? messagesByRoom[selectedChatId] ?? []
    : [];

<<<<<<< HEAD
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
    if (!open || !selectedChatId || !tokenData) return;
    const s = connectSocket(tokenData.token);
    s.emit("join", { roomId: selectedChatId });

    let cancelled = false;

    (async () => {
      const { data } = await api.get(
        `/backend/rooms/${selectedChatId}/messages`,
        {
          params: { limit: 50 },
          headers: { Authorization: `Bearer ${tokenData.token}` },
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
  }, [open, selectedChatId, tokenData?.token, query, select, recomputeChats]);

  // 팝업 닫힐 때 소켓 정리
  useEffect(() => {
    if (open) return;
    const s = getSocket();
    if (s) s.disconnect();
  }, [open]);


  // 전송
  const onSendMessage = useCallback(
    (roomId: string, content: string) => {
      if (!tokenData) return;
      const now = new Date().toISOString();
      const tempId = `tmp-${Math.random().toString(36).slice(2)}`;
      const tempMsg: Message = {
        id: tempId,
        tempId,
=======
  const onSendMessage = useCallback(
    (roomId: string, content: string) => {
      const now = new Date().toISOString();
      const tempMsg: Message = {
        id: `tmp-${Math.random().toString(36).slice(2)}`,
>>>>>>> 8793f175028584323bf4c4cafb907debcbc664af
        roomId,
        senderId: currentUserId,
        content,
        createdAt: now,
<<<<<<< HEAD
        status: "sending",
      };

=======
        status: "sent", // 데모: 바로 sent. 실제론 'sending' 후 ack에서 'sent'로
      };

      // 1) 채팅창에 낙관적으로 메시지 추가
>>>>>>> 8793f175028584323bf4c4cafb907debcbc664af
      setMessagesByRoom((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] ?? []), tempMsg],
      }));

<<<<<<< HEAD
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

      const s = getSocket() ?? connectSocket(tokenData.token);
      s.emit("send", { roomId, content, tempId });
    },
    [currentUserId, tokenData, query, select, recomputeChats]
  );

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
  }, [open, currentUserId, query, select, recomputeChats, selectedChatId, onSendMessage]);

=======
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
>>>>>>> 8793f175028584323bf4c4cafb907debcbc664af

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
<<<<<<< HEAD

  // 입력 & 전송
  // const [text, setText] = useState("");
  // const send = useCallback(async () => {
  //   console.log("send", text);
  //   const trimmed = text.trim();
  //   if (!trimmed || !selectedChatId) return;
  //   // console.log('selectedChatId', selectedChatId);
  //   if (!tokenData) return;
  //   try {

  //     const {token, userId} = tokenData;
  //     const response = await api.get(`${NEXT_API_URL}/api/chat`, {
  //       params: {
  //         roomId: selectedChatId,
  //         userId: userId,
  //         content: trimmed,
  //       },
  //       headers: { Authorization: `Bearer ${token}`}
  //     });
  //     if (response.status === 200) {
  //       onSendMessage(selectedChatId, trimmed);
  //       setText("");
  //     }
  //   } catch (error) {
  //     setText("");  
  //   }
  // }, [text, selectedChatId, onSendMessage]);
=======
>>>>>>> 8793f175028584323bf4c4cafb907debcbc664af
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

<<<<<<< HEAD
  // 1:1 시작
  const onStartDirect = useCallback(
    async (otherUserId: string) => {
      if (!tokenData) return;
      
      const { token, userId } = tokenData;
      const { data } = await api.get(
        `${NEXT_API_URL}/api/backend/rooms/direct`,
        {
          params: {
            currentUserId: userId,
            otherUserId: otherUserId,
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const roomId =
        data?.chat_room_id ?? data?.roomId ?? data?.id ?? String(data?.room_id);
      if (!roomId) return;

      setselectedChatId(roomId);

      // 목록에 없으면 보강
      setBaseChats((prev) => {
        const exists = prev.some((c) => c.chat_room_id === roomId);
        if (exists) return prev;
        const next = [
          {
            chat_room_id: roomId,
            name: data?.name ?? "새 대화",
            is_private: true,
            lastMessage: "",
            lastMessageAt: new Date().toISOString(),
            last_read_at: "1970-01-01T00:00:00.000Z",
            searchIndex: "", // 아직 메시지 없음
          },
          ...prev,
        ];
        setChats(recomputeChats(next, query, select));
        return next;
      });
    },
    [query, select, recomputeChats, tokenData]
  );

=======
>>>>>>> 8793f175028584323bf4c4cafb907debcbc664af
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
