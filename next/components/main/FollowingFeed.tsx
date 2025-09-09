"use client";
import { HomeCard } from "./HomeCardList";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchFollowingFeed } from "@/lib/api/users";

export function FollowingFeed() {
  const { data: session, status } = useSession();
  const [followingRooms, setFollowingRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFollowingFeed = async () => {
      if (!session?.user?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const rooms = await fetchFollowingFeed(session.user.id, 8);
        setFollowingRooms(rooms);
      } catch (err) {
        console.error("Error loading following feed:", err);
        setError("팔로잉 피드를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      loadFollowingFeed();
    }
  }, [session, status]);

  // 로그인하지 않은 경우 렌더링하지 않음
  if (status === "unauthenticated") {
    return null;
  }

  // 로딩 중이거나 팔로잉 방이 없는 경우
  if (status === "loading" || loading) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-2xl font-bold text-[#1c140d] dark:text-gray-100">
            👥 팔로잉 피드
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent dark:from-orange-400"></div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 dark:text-gray-400">로딩 중...</div>
        </div>
      </div>
    );
  }

  // 팔로잉한 사람이 없거나 방이 없는 경우
  if (followingRooms.length === 0) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-2xl font-bold text-[#1c140d] dark:text-gray-100">
            👥 팔로잉 피드
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent dark:from-orange-400"></div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="mb-2">팔로잉 중인 사용자들의 새로운 방이 없습니다.</p>
            <p className="text-sm">다른 사용자들을 팔로우해보세요! 👀</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-2xl font-bold text-[#1c140d] dark:text-gray-100">
          👥 팔로잉 피드
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent dark:from-orange-400"></div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {followingRooms.length}개의 새로운 방
        </span>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div className="flex overflow-x-auto gap-4 pb-2">
        {followingRooms.map((room: any) => (
          <div key={room.room_id} className="flex-shrink-0 w-64">
            <HomeCard room={room} />
          </div>
        ))}
      </div>
    </div>
  );
}