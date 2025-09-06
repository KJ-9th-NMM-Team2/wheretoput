// 사용자 검색 관리 훅
// 사용자 검색, 검색 결과 관리를 담당

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/client/api";
import { UserLite } from "../types/chat-types";

export const useUserSearch = (
  open: boolean,
  query: string,
  currentUserId: string | null
) => {
  const { data: session } = useSession();
  const [peopleHits, setPeopleHits] = useState<UserLite[]>([]);

  useEffect(() => {
    if (!open) return;

    const q = query.trim();
    if (!q) {
      setPeopleHits([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const { data } = await api.get("api/backend", {
          params: { q, limit: 20 },
        });
        const users = data ?? [];
        const rows: UserLite[] = (users ?? []).map((u: any) => ({
          id: String(u.id),
          name: u.name ?? "이름 없음",
          image: u.image ?? undefined,
        }));
        const actualCurrentUserId = currentUserId || session?.user?.id;
        const filtered = rows.filter((u) => u.id !== actualCurrentUserId);
        console.log(
          "Search results with images:",
          filtered.map((u) => ({ name: u.name, image: u.image }))
        );
        setPeopleHits(filtered);
      } catch {
        setPeopleHits([]);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [open, query, currentUserId, session?.user?.id]);

  return { peopleHits };
};
