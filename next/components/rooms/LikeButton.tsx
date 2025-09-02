"use client";

import { fetchPostLike } from "@/lib/api/likes";
import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";

export default function LikeButton({
  room,
  liked,
}: {
  room: { num_likes: number; room_id: string };
  liked: boolean;
}) {
  // 좋아요 수
  const [likes, setLikes] = useState(room.num_likes);
  // 좋아요를 눌렀는지 여부
  const [youLiked, setYouLiked] = useState(liked);
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  // 사용자 정보
  const { data: session } = useSession();

  const handleLikeClick = useCallback(async () => {
    if (isLoading) return;

    // 로그인이 되지 않은 경우
    if (!session?.user?.id) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 일단 대기
    setIsLoading(true);
    try {
      console.log(session);
      const result = await fetchPostLike(room.room_id, session.user.id);
      if (result.success) {
        // 성공 시에만 UI 업데이트
        setYouLiked(!youLiked);
        setLikes((prevLikes) => (youLiked ? prevLikes - 1 : prevLikes + 1));
      }
    } catch (error) {
      // 에러 처리는 조용히
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, session, room.room_id, youLiked]);

  return (
    <div className="flex items-center justify-center gap-2 px-3 py-2">
      <div
        className={`cursor-pointer transition-all duration-200 hover:scale-110 hover:drop-shadow-lg ${
          youLiked
            ? "text-red-500 hover:text-red-600 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
            : "text-[#8a7260] dark:text-orange-300 hover:text-red-400 dark:hover:text-red-400"
        } ${isLoading ? "opacity-50 cursor-wait" : ""}`}
        data-icon="Heart"
        data-size="24px"
        data-weight="regular"
        onClick={handleLikeClick}
        title={youLiked ? "좋아요 취소" : "좋아요"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24px"
          height="24px"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path
            d={
              youLiked
                ? "M178,32c-20.65,0-38.73,8.88-50,23.89C116.73,40.88,98.65,32,78,32A62.07,62.07,0,0,0,16,94c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,220.66,240,164,240,94A62.07,62.07,0,0,0,178,32Z"
                : "M178,32c-20.65,0-38.73,8.88-50,23.89C116.73,40.88,98.65,32,78,32A62.07,62.07,0,0,0,16,94c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,220.66,240,164,240,94A62.07,62.07,0,0,0,178,32ZM128,206.8C109.74,196.16,32,147.69,32,94A46.06,46.06,0,0,1,78,48c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,147.61,146.24,196.15,128,206.8Z"
            }
          ></path>
        </svg>
      </div>
      <p
        className={`font-bold leading-normal tracking-[0.015em] transition-colors ${
          youLiked
            ? "text-red-500 drop-shadow-sm"
            : "text-[#8a7260] dark:text-orange-300"
        }`}
      >
        {likes}
      </p>
    </div>
  );
}
