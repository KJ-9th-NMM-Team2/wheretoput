// 채팅 관련 유틸리티 함수들
// ChatButton.tsx에서 분리된 헬퍼 함수들

import { ChatListItem, Message } from "../types/chat-types";

// 타임스탬프 파싱 함수
export const ts = (s?: string): number => {
  if (!s) return -Infinity;
  const t = Date.parse(s.replace(/\s+/g, ""));
  return Number.isNaN(t) ? -Infinity : t;
};

// 읽지 않은 메시지 체크
export const isUnread = (chat: ChatListItem): boolean =>
  ts(chat.lastMessageAt) > ts(chat.last_read_at);

// 최신 메시지 순으로 정렬
export const byLatest = (a: ChatListItem, b: ChatListItem): number =>
  ts(b.lastMessageAt) - ts(a.lastMessageAt);

// 상대적 시간 포맷팅
export function formatRelativeTime(isoString?: string): string {
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

// 시:분 포맷
export const hhmm = (iso: string): string =>
  new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

// 아바타 표시 여부 결정
export const shouldShowAvatar = (arr: Message[], idx: number): boolean => {
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

// 타임스탬프 표시 여부 결정
export const shouldShowTimestamp = (arr: Message[], idx: number): boolean => {
  if (idx === arr.length - 1) return true;
  const cur = arr[idx];
  const next = arr[idx + 1];
  const curTime = hhmm(cur.createdAt);
  const nextTime = hhmm(next.createdAt);
  return curTime !== nextTime;
};

// 날짜 키 생성
export const dayKey = (iso: string): string =>
  new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });

// 채팅 재계산 (검색 및 필터링)
export const recomputeChats = (
  raw: ChatListItem[],
  q: string,
  mode: "전체" | "읽지 않음"
): ChatListItem[] => {
  const src = mode === "읽지 않음" ? raw.filter(isUnread) : raw;
  const k = q.trim().toLocaleLowerCase("ko-KR");

  if (!k) {
    return [...src].sort(byLatest);
  }

  const filtered = src.filter((c) => c.searchIndex.includes(k));
  console.log("filted", filtered);
  return filtered.sort(byLatest);
};