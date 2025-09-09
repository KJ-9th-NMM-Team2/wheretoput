"use client";
import Link from "next/link";
import { FaEye, FaCommentDots } from "react-icons/fa";
import { FcLike } from "react-icons/fc";
import { useState } from "react";

// 메인 홈페이지 카드 리스트
export function HomeCard({ room }: { room: any }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Link href={`/rooms/${room.room_id}`} className="h-full w-full group">
      <div 
        className="flex h-full flex-1 flex-col gap-3 rounded-lg min-w-52 transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg bg-white dark:bg-gray-800 overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          <div
            className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex flex-col relative overflow-hidden"
            style={{
              backgroundImage: `url('${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${room.thumbnail_url}'), url('/placeholder.png')`,
            }}
          >
            {/* 호버 시 오버레이 */}
            {isHovered && (
              <div className="absolute inset-0 bg-black bg-opacity-20 transition-opacity duration-200 flex items-end p-3">
                <div className="text-white text-xs bg-black bg-opacity-50 rounded px-2 py-1">
                  클릭해서 자세히 보기
                </div>
              </div>
            )}
            
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

        <div className="px-3 pb-3 flex flex-col gap-2">
          {/* 방 제목 */}
          <p className="text-[#1c140d] dark:text-gray-100 text-base font-medium leading-normal line-clamp-2">
            {room.title}
          </p>

          {/* 작성자 프로필 정보 */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-orange-600 flex items-center justify-center overflow-hidden">
              {room.user?.image ? (
                <img
                  src={room.user.image}
                  alt={room.user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-amber-700 dark:text-orange-200">
                  {room.user?.name?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            <span className="text-amber-700 dark:text-orange-300 text-sm font-medium">
              {room.user?.display_name || room.user?.name || "익명"}
            </span>
          </div>

          {/* 좋아요/댓글/조회수 통계 */}
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <FcLike className="w-4 h-4" />
                <span>{room.num_likes || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <FaCommentDots className="w-3 h-3" />
                <span>{room.num_comments || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <FaEye className="w-3 h-3" />
                <span>{room.view_count || 0}</span>
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
