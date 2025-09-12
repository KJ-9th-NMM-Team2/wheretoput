"use client";
import Link from "next/link";
import { FaEye, FaCommentDots } from "react-icons/fa";
import { FcLike } from "react-icons/fc";
import { useState } from "react";

// 메인 홈페이지 카드 리스트
export function HomeCard({
  room,
  isDeleteMode = false,
  onThumbnailClick
}: {
  room: any;
  isDeleteMode?: boolean;
  onThumbnailClick?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleThumbnailClick = (e: React.MouseEvent) => {
    if (isDeleteMode) {
      e.preventDefault();
      onThumbnailClick?.();
    }
  };

  return (
    <Link href={isDeleteMode ? "#" : `/rooms/${room.room_id}`} className="h-full w-full group">
      <div
        className="flex h-full flex-1 flex-col gap-3 rounded-lg max-w-sm w-full transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-xl bg-white dark:bg-gray-800 overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          <div
            className="w-full bg-center bg-no-repeat bg-cover rounded-xl flex flex-col relative overflow-hidden h-[178px] lg:h-[243px]"
            style={{
              backgroundImage: `url('${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${room.thumbnail_url}'), url('/placeholder_1.jpg')`,
            }}
            onClick={handleThumbnailClick}
          >


            {/* 방 스타일 태그 */}
            {room.style && (
              <div className="absolute top-2 left-2">
                <span className="bg-amber-600 dark:bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  {room.style}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-4 flex flex-col gap-3" onClick={handleThumbnailClick}>
          {/* 방 제목 */}
          <p className="text-[rgb(47,52,56)] dark:text-gray-100 text-base font-bold leading-5 line-clamp-2 mt-[3px] overflow-hidden break-all">
            {room.title}
          </p>

          {/* 작성자 프로필 정보 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-orange-600 flex items-center justify-center overflow-hidden">
              {room.user?.image ? (
                <img
                  src={room.user.image}
                  alt={room.user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-amber-700 dark:text-orange-200">
                  {room.user?.name?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            <span className="text-black dark:text-gray-100 text-base font-medium">
              {room.user?.display_name || room.user?.name || "익명"}
            </span>
          </div>

          {/* 댓글,조회수 */}
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <FcLike className="w-4 h-4" />
                <span className="font-medium">{room.num_likes || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <FaCommentDots className="w-4 h-4" />
                <span className="font-medium">{room.num_comments || 0}</span>
              </div>

            </div>

            {/* 생성일 */}
            {room.created_at && (
              <span className="text-xs text-gray-400">
                {new Date(room.created_at).toLocaleDateString('ko-KR', {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">조회 {room.view_count || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function HomeCardList({ rooms }: { rooms: any[] }) {
  return (
    <>
      {rooms.map((room: any) => (
        <HomeCard key={room.room_id} room={room} />
      ))}
    </>
  );
}
