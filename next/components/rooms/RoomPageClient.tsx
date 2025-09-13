"use client";

import { useSession } from "next-auth/react";
import LikeButton from "@/components/rooms/LikeButton";
import Link from "next/link";
import FurnituresList from "@/components/rooms/FurnituresList";
import CommentsList from "@/components/rooms/CommentsList";
import { useEffect, useState } from "react";
import { fetchLike } from "@/lib/api/likes";
import { followUser, unfollowUser, checkFollowStatus } from "@/lib/api/users";
import EditPopup from "@/components/sim/side/EditPopup";
import { useRouter } from "next/navigation";
import { deleteRoom } from "@/lib/roomService";

interface RoomPageClientProps {
  room: any;
}

export default function RoomPageClient({ room }: RoomPageClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);

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

  useEffect(() => {
    const checkFollow = async () => {
      if (session?.user?.id && room.user.id !== session.user.id) {
        try {
          const followStatus = await checkFollowStatus(session.user.id, room.user.id);
          setIsFollowing(followStatus);
        } catch (error) {
          console.error("Failed to check follow status:", error);
        }
      }
    };

    checkFollow();
  }, [session?.user?.id, room.user.id]);

  const handleFollowToggle = async () => {
    if (!session?.user?.id || followLoading) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        const success = await unfollowUser(room.user.id);
        if (success) {
          setIsFollowing(false);
        }
      } else {
        const success = await followUser(room.user.id);
        if (success) {
          setIsFollowing(true);
        }
      }
    } catch (error) {
      console.error("Follow toggle failed:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSave = async (title: string, description: string, isPublic: boolean) => {
    try {
      const response = await fetch(`/api/rooms/${room.room_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          is_public: isPublic,
        }),
      });

      if (response.ok) {
        setShowEditPopup(false);
        router.refresh();
      } else {
        console.error("Failed to update room");
      }
    } catch (error) {
      console.error("Error updating room:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말로 이 방을 삭제하시겠습니까?")) return;

    const success = await deleteRoom(room.room_id);
    if (success) {
      router.push("/");
    } else {
      alert("방 삭제에 실패했습니다.");
    }
  };

  const isOwnRoom = session?.user?.id === room.user.id;


  // 동일 가구 포함 x
  const uniqueFurnituresByRoom = Array.from(
    new Map(room.room_objects.map((o: any) => [o.furniture_id, o])).values()
  );
  //console.log(uniqueFurnituresByRoom);

  return (
    <>
      <div className="layout-container flex h-full grow flex-col">
        {/* 썸네일 섹션 - 75% 너비 */}
        <div className="w-3/4 mx-auto aspect-[4/3] max-h-[500px] overflow-hidden bg-gray-100 dark:bg-gray-800 relative rounded-lg">
          <img
            src={room?.thumbnail_url
              ? `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${room.thumbnail_url}`
              : "/placeholder_1.jpg"
            }
            alt={room?.title || "Room thumbnail"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        </div>

        <div className="px-40 flex flex-1 justify-center">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="flex flex-wrap gap-2 p-4">
              <span className="text-[#181411] dark:text-gray-100 text-base font-medium leading-normal"></span>
            </div>
            <div className="px-4 py-6">
              <h1 className="text-[#181411] dark:text-gray-100 text-3xl font-bold leading-tight tracking-[-0.015em]">
                {room?.title}
              </h1>
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
              <div className="flex flex-1 gap-6 flex-wrap px-4 py-3 justify-start">
                <Link href={`/sim/${room.room_id}`} rel="noopener noreferrer">
                  <button className="flex min-w-[124px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-12 px-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-base font-bold leading-normal tracking-[0.015em] hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <span className="truncate">3D View</span>
                  </button>
                </Link>
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

              {/* 사용자 프로필 + 날짜 */}
              <span className="text-[#181411] dark:text-gray-100 text-base font-normal leading-normal flex-1">
                <span className="font-medium text-lg">{room.user.name}</span>
              </span>

              {/* 팔로우 버튼 */}
              {session?.user?.id && session.user.id !== room.user.id && (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`ml-4 ${isFollowing ? "following-button" : "follow-button"}`}
                >
                  {followLoading ? "처리 중..." : isFollowing ? "팔로잉" : "팔로우"}
                </button>
              )}
              {!room.is_public && (
                <span className="ml-2 px-2 py-1 rounded bg-red-100 dark:bg-gray-700 text-red-700 dark:text-orange-200 text-xs font-semibold">
                  비공개
                </span>
              )}
            </div>

            {/* 조회수 , 댓글 , 날짜 통계 */}
            <div className="px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                <span>조회 {room.view_count}</span>
                <span>｜</span>
                <span>댓글 {room.num_comments}</span>
                <span>｜</span>
                <span>
                  {new Date(room.updated_at).toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              {isOwnRoom && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEditPopup(true)}
                    className="px-3 py-1.5 text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 bg-gray-300 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-all duration-200 shadow-sm hover:shadow-md hover:scale-102"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 text-base text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-md transition-all duration-200 shadow-sm hover:shadow-md hover:scale-102"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            <div className="mx-4 mt-6 mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {room.description}
              </p>
            </div>
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

      {showEditPopup && (
        <EditPopup
          initialTitle={room.title}
          initialDescription={room.description}
          initialIsPublic={room.is_public}
          isOwnUserRoom={isOwnRoom}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setShowEditPopup(false)}
          handleOutofRoomClick={() => {}}
          showHomeButton={false}
        />
      )}
    </>
  );
}
