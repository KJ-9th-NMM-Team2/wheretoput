"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import styles from "./ChatButton.module.scss";
import { AnimatePresence, motion } from "framer-motion";
import { api, setAuthToken } from "@/lib/client/api";
import { connectSocket, getSocket } from "@/lib/client/socket";

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
    tempId?: string; // ACK 매핑용
};

export default function ChatPage({
    jwt,
    currentUserId,
}: {
    jwt: string;
    currentUserId: string;
}) {
    const [open, setOpen] = useState(false);
    const [select, setSelect] = useState<"전체" | "읽지 않음">("전체");
    const [selectedChatId, setselectedChatId] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    // 시간→정렬 유틸
    const ts = (s?: string) => {
        if (!s) return -Infinity;
        const t = Date.parse(s.replace(/\s+/g, ""));
        return Number.isNaN(t) ? -Infinity : t;
    };
    const isUnread = (chat: ChatListItem) =>
        ts(chat.lastMessageAt) > ts(chat.last_read_at);
    const byLatest = (a: ChatListItem, b: ChatListItem) =>
        ts(b.lastMessageAt) - ts(a.lastMessageAt);

    // 방 목록(원본/표시용)
    const [baseChats, setBaseChats] = useState<ChatListItem[]>([]);
    const [chats, setChats] = useState<ChatListItem[]>([]);

    // roomId -> 메시지 배열
    const [messagesByRoom, setMessagesByRoom] = useState<Record<string, Message[]>>(
        {}
    );

    // 선택된 방의 메시지
    const selectedMessages: Message[] = selectedChatId
        ? messagesByRoom[selectedChatId] ?? []
        : [];
    const selectedChat =
        chats.find((c) => c.chat_room_id === selectedChatId) ?? null;

    // 상대시간 포맷
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
        return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
    }

    // 표시 리스트 계산(검색/읽지않음)
    const recomputeChats = useCallback(
        (raw: ChatListItem[], q: string, mode: "전체" | "읽지 않음") => {
            const src = mode === "읽지 않음" ? raw.filter(isUnread) : raw;
            const qLower = q.trim().toLowerCase();
            const filtered = qLower
                ? src.filter(
                    (c) =>
                        c.name?.toLowerCase().includes(qLower) ||
                        c.lastMessage?.toLowerCase().includes(qLower)
                )
                : src;
            return [...filtered].sort(byLatest);
        },
        []
    );

    // JWT 주입
    useEffect(() => {
        setAuthToken(jwt ?? null);
    }, [jwt]);

    // 팝업 열릴 때 방 목록 로드
    useEffect(() => {
        if (!open) return;
        (async () => {
            const { data } = await api.get("/rooms");
            const mapped: ChatListItem[] = (data ?? []).map((r: any) => ({
                chat_room_id: r.chat_room_id ?? r.id ?? String(r.room_id),
                name: r.name ?? r.title ?? "이름 없음",
                is_private: !!r.is_private,
                lastMessage: r.last_message?.content ?? r.lastMessage ?? "",
                lastMessageAt:
                    r.last_message?.created_at ?? r.lastMessageAt ?? undefined,
                last_read_at:
                    r.last_read_at ?? r.lastReadAt ?? "1970-01-01T00:00:00.000Z",
            }));
            setBaseChats(mapped);
            setChats(recomputeChats(mapped, "", "전체"));
            setSelect("전체");
            setQuery("");
        })();
    }, [open, recomputeChats]);

    // 방 선택 시: join + 히스토리 로드, 해제 시 leave
    useEffect(() => {
        if (!open || !selectedChatId) return;
        const s = connectSocket(jwt);
        s.emit("join", { roomId: selectedChatId });

        let cancelled = false;

        (async () => {
            const { data } = await api.get(`/rooms/${selectedChatId}/messages`, {
                params: { limit: 50 },
            });
            if (cancelled) return;
            const history: Message[] = (data?.messages ?? data ?? []).map((m: any) => ({
                id: m.id ?? String(m.message_id),
                roomId: m.roomId ?? String(m.room_id ?? selectedChatId),
                senderId: m.senderId ?? String(m.user_id),
                senderName: m.sender?.name ?? m.user?.name,
                avatarUrl: m.sender?.image ?? m.user?.image,
                content: m.content,
                createdAt: m.createdAt ?? m.created_at,
                status: "read",
            }));
            setMessagesByRoom((prev) => ({ ...prev, [selectedChatId]: history }));

            // 읽음 처리 즉시 전송 + 목록의 last_read_at 갱신
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
    }, [open, selectedChatId, jwt, query, select, recomputeChats]);

    // 팝업 닫힐 때 소켓 정리
    useEffect(() => {
        if (open) return;
        const s = getSocket();
        if (s) s.disconnect();
    }, [open]);

    // 실시간 수신 + ACK
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

            // 메시지 append
            setMessagesByRoom((prev) => ({
                ...prev,
                [msg.roomId]: [...(prev[msg.roomId] ?? []), msg],
            }));

            // 목록 메타 갱신(함수형 업데이트 + 현재 query/select 반영)
            setBaseChats((prev) => {
                const updated = prev.map((c) =>
                    c.chat_room_id === msg.roomId
                        ? { ...c, lastMessage: msg.content, lastMessageAt: msg.createdAt }
                        : c
                );
                setChats(recomputeChats(updated, query, select));
                return updated;
            });
        };

        // 전송 ACK: 서버에서 { tempId, realId, createdAt? } 형태 권장
        const onAck = (ack: { tempId: string; realId: string; createdAt?: string }) => {
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

        // 읽음 반영(다른 참여자 기준으로 서버가 push하는 경우)
        const onRead = (evt: { roomId: string }) => {
            if (evt.roomId !== selectedChatId) return;
            // 선택 방이 열려 있을 때 내 메시지 상태를 read로 승격
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

    // 메시지 전송(낙관적 + 실제 emit)
    const onSendMessage = useCallback(
        (roomId: string, content: string) => {
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

            // 1) 낙관적 append
            setMessagesByRoom((prev) => ({
                ...prev,
                [roomId]: [...(prev[roomId] ?? []), tempMsg],
            }));

            // 2) 목록 메타 갱신(함수형 + 필터 재적용)
            setBaseChats((prev) => {
                const updated = prev.map((c) =>
                    c.chat_room_id === roomId
                        ? {
                            ...c,
                            lastMessage: content,
                            lastMessageAt: now,
                            last_read_at: now,
                        }
                        : c
                );
                setChats(recomputeChats(updated, query, select));
                return updated;
            });

            // 3) 서버 전송
            const s = getSocket() ?? connectSocket(jwt);
            s.emit("send", { roomId, content, tempId });
        },
        [currentUserId, jwt, query, select, recomputeChats]
    );

    // 시간/그룹핑/버블 유틸
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
            ) < 3 * 60 * 1000;
        return !(sameSender && within3m);
    };

    function Bubble({ m, showAvatar }: { m: Message; showAvatar: boolean }) {
        const isMine = m.senderId === currentUserId;
        return (
            <div className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
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

                <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                    {!isMine && showAvatar && m.senderName ? (
                        <span className="text-[11px] text-gray-400 pl-1 mb-0.5">{m.senderName}</span>
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

    // 오토스크롤: 사용자 하단 여부 추적
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

    // 날짜 헤더 키 & 그룹핑(한 번만 선언해서 재사용)
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

    const onEditorKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <main className="p-10">
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
                            setChats(recomputeChats(baseChats, "", "전체"));
                        }
                        if (!next) {
                            // 팝업 닫으면서 방 선택 해제
                            setselectedChatId(null);
                        }
                        return next;
                    })
                }
            >
                채팅
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
                                        <svg width="18" height="18" viewBox="0 0 24 24" className="mr-2 opacity-70 text-black-500">
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
                                            className={`px-3 py-2 rounded-xl transition cursor-pointer ${select === "전체" ? "bg-gray-200 text-blue-500" : "bg-transparent hover:bg-gray-200"
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
                                            className={`px-3 py-2 rounded-xl transition cursor-pointer ${select === "읽지 않음" ? "bg-gray-200 text-blue-500" : "bg-transparent hover:bg-gray-200"
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
                                                        <div className="text-sm text-gray-500 truncate w-40">{chat.lastMessage}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {unread && <span className="w-3 h-3 rounded-full bg-orange-500" />}
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
                                            <b className="px-2 truncate">{selectedChat?.name ?? "채팅"}</b>
                                        </div>
                                        <button
                                            onClick={() => setselectedChatId(null)}
                                            className="px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                                        >
                                            ←
                                        </button>
                                    </header>

                                    {/* 채팅내용 */}
                                    <div ref={listRef} className="flex-1 space-y-4 px-3 overflow-y-auto py-2">
                                        {Object.entries(groupedByDay).map(([date, arr]) => (
                                            <div key={date} className="space-y-3">
                                                <div className="sticky top-0 z-10 flex justify-center">
                                                    <span className="text-[11px] bg-white/80 backdrop-blur px-2 py-1 rounded-full border border-gray-200 text-gray-500">
                                                        {date}
                                                    </span>
                                                </div>
                                                {arr.map((m, i) => (
                                                    <Bubble key={m.id} m={m} showAvatar={shouldShowAvatar(arr, i)} />
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
                                                className={`px-3 py-2 rounded-lg text-white cursor-pointer ${text.trim() ? "bg-orange-500 hover:bg-orange-600" : "bg-gray-300 cursor-not-allowed"
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
        </main>
    );
}
