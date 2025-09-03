"use client";

import { useSession } from "next-auth/react";
import LikeButton from "@/components/rooms/LikeButton";
import Link from "next/link";
import FurnituresList from "@/components/rooms/FurnituresList";
import CommentsList from "@/components/rooms/CommentsList";
import { useEffect, useState } from "react";
import { fetchLike } from "@/lib/api/likes";
import { View } from "lucide-react";
import { Span } from "next/dist/trace";

interface RoomPageClientProps {
  room: any;
}

export default function RoomPageClient({ room }: RoomPageClientProps) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  // 조회수 1 증가
  useEffect(() => {
    fetch(`/api/views`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ room_id: room.room_id }),
    }).then();
  }, [room.room_id]);

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (session?.user?.id) {
        try {
          const likeData = await fetchLike(room.room_id, session.user.id);
          setLiked(likeData?.liked ?? false);
        } catch (error) {
          console.error("Failed to fetch like status:", error);
          setLiked(false);
        }
      }
      setLoading(false);
    };

    checkLikeStatus();
  }, [session?.user?.id, room.room_id]);

  console.log("방 정보:", room);

  // 동일 가구 포함 x
  const uniqueFurnituresByRoom = Array.from(
    new Map(room.room_objects.map((o: any) => [o.furniture_id, o])).values()
  );
  console.log(uniqueFurnituresByRoom);

  return (
    <>
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-40 flex flex-1 justify-center">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="flex flex-wrap gap-2 p-4">
              <span className="text-[#181411] dark:text-gray-100 text-base font-medium leading-normal"></span>
            </div>
            <div className="@container">
              <div className="@[480px]:px-4 @[480px]:py-3">
                <div
                  className="bg-cover bg-center flex flex-col justify-end overflow-hidden bg-white dark:bg-gray-800 @[480px]:rounded-xl min-h-80"
                  style={{
                    backgroundImage: room?.thumbnail_url
                      ? `linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 25%), 
     url("${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${room.thumbnail_url}"), 
     url("/placeholder.png")`
                      : `linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 25%), 
     url("/placeholder.png")`,
                  }}
                >
                  <div className="flex p-4">
                    <p className="text-white tracking-light text-[28px] font-bold leading-tight">
                      {room?.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              {room.root_room_id && room.rooms ? (
                <Link
                  href={`/rooms/${room.root_room_id}`}
                  className="px-4 text-amber-700 hover:text-amber-900 dark:text-orange-200 dark:hover:text-amber-400"
                >
                  {room.rooms.user.name}님의 {room.rooms.title}에서 복제된
                  방입니다.
                </Link>
              ) : (
                ""
              )}
            </div>
            <div className="flex justify-stretch">
              <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-start">
                <Link href={`/sim/${room.room_id}`} rel="noopener noreferrer">
                  <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#f5f2f0] dark:bg-gray-700 text-[#181411] dark:text-gray-100 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors">
                    <span className="truncate">3D로 보기</span>
                  </button>
                </Link>
                <span className="flex items-center gap-1">
                  <View size={20} />
                  {room.view_count}
                </span>
                {!loading && <LikeButton room={room} liked={liked} />}
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2">
              <Link href={`/users/${room.user.id}`}>
                {room.user.image ? (
                  <img
                    src={room.user.image}
                    alt={room.user.name}
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 
        transition-all duration-200 hover:scale-110 hover:ring-4 cursor-pointer
        ring-amber-200 hover:ring-amber-300
        dark:ring-gray-600 dark:hover:ring-amber-400"
                  />
                ) : (
                  <span className="text-xl font-bold text-amber-700 dark:text-orange-200">
                    {room.user.name?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
              </Link>
              <span className="text-[#181411] dark:text-gray-100 text-base font-normal leading-normal">
                {room.user.name} on {room.updated_at.slice(0, 10)}
              </span>
              {!room.is_public && (
                <span className="ml-2 px-2 py-1 rounded bg-red-100 dark:bg-gray-700 text-red-700 dark:text-orange-200 text-xs font-semibold">
                  비공개
                </span>
              )}
            </div>
            <p className="text-[#181411] dark:text-gray-100 text-base font-normal leading-normal pb-3 pt-1 px-4">
              {room.description}
            </p>
            <h2 className="text-[#181411] dark:text-gray-100 text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              가구 프리뷰
            </h2>
            <FurnituresList room_objects={uniqueFurnituresByRoom} />

            <h2 className="text-[#181411] dark:text-gray-100 text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              댓글 ({room.num_comments})
            </h2>
            <CommentsList
              room_comments={room.room_comments}
              currentUserId={session?.user?.id}
            />
          </div>
        </div>
      </div>
    </>
  );
}
