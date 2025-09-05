"use client";

import { fetchUserById, fetchUserRooms, fetchFollowers, fetchFollowing, followUser, unfollowUser } from "@/lib/api/users";
import HouseCard from "@/components/search/HouseCard";
import { auth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import EditPopup from "@/components/sim/side/EditPopup";
import { updateRoomInfo, deleteRoom } from "@/lib/roomService";
import { FaTrashCan } from "react-icons/fa6";

import { FollowsModal } from "@/app/follows/page";

export default function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, setUser] = useState<any>(null);
  const [userRooms, setUserRooms] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<"followers" | "following">("followers");
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params;
      const { id } = resolvedParams;

      try {
        const userData = await fetchUserById(id);
        console.log("가져온 사용자 데이터:", userData);
        setUser(userData);

        const ownerStatus = session?.user?.id === id;
        setIsOwner(ownerStatus);

        // 접속한 사용자가 본인 페이지일 경우 비공개 방도 포함하여 조회
        const roomsData = await fetchUserRooms(id, "short", "new", ownerStatus);
        setUserRooms(roomsData);

        // 팔로워/팔로잉 수 가져오기
        const followersData = await fetchFollowers(id);
        const followingData = await fetchFollowing(id);
        setFollowersCount(followersData.length);
        setFollowingCount(followingData.length);

        // 현재 사용자가 이 프로필 사용자를 팔로우하고 있는지 확인
        if (session?.user?.id && session.user.id !== id) {
          const myFollowingData = await fetchFollowing(session.user.id);
          setIsFollowing(myFollowingData.some(user => user.id === id));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params, session]);

  const handleEditRoom = (room: any) => {
    setEditingRoom(room);
  };

  const handleSaveRoom = async (
    title: string,
    description: string,
    isPublic: boolean
  ) => {
    if (!editingRoom) return;

    const success = await updateRoomInfo(editingRoom.room_id, {
      title,
      description,
      is_public: isPublic,
    });

    if (success) {
      // 방 목록 업데이트
      setUserRooms((prev) =>
        prev.map((room) =>
          room.room_id === editingRoom.room_id
            ? { ...room, title, description, is_public: isPublic }
            : room
        )
      );
      setEditingRoom(null);
    }
  };

  const handleDeleteRoom = async () => {
    if (!editingRoom) return;

    if (!confirm("정말로 이 방을 삭제할까요?")) {
      return;
    }

    const success = await deleteRoom(editingRoom.room_id);
    if (success) {
      // 방 목록에서 제거
      setUserRooms((prev) =>
        prev.filter((room) => room.room_id !== editingRoom.room_id)
      );
      setEditingRoom(null);
      alert("방이 성공적으로 삭제되었습니다.");
    } else {
      alert("방 삭제에 실패했습니다.");
    }
  };

  const handleToggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedRooms(new Set());
  };

  const handleRoomSelect = (roomId: string) => {
    setSelectedRooms((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(roomId)) {
        newSelected.delete(roomId);
      } else {
        newSelected.add(roomId);
      }
      return newSelected;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedRooms.size === 0) return;

    if (!confirm(`선택한 ${selectedRooms.size}개의 방을 정말 삭제할까요?`)) {
      return;
    }

    const deletedRooms = new Set<string>();
    for (const roomId of selectedRooms) {
      const success = await deleteRoom(roomId);
      if (success) {
        deletedRooms.add(roomId);
      }
    }

    if (deletedRooms.size > 0) {
      // 성공적으로 삭제된 방들을 목록에서 제거
      setUserRooms((prev) =>
        prev.filter((room) => !deletedRooms.has(room.room_id))
      );
      setSelectedRooms(new Set());
      setIsDeleteMode(false);

      // 사용자에게 결과 알림
      if (deletedRooms.size === selectedRooms.size) {
        alert(`${deletedRooms.size}개의 방이 성공적으로 삭제되었습니다.`);
      } else {
        alert(
          `${deletedRooms.size}개의 방이 삭제되었습니다. (${
            selectedRooms.size - deletedRooms.size
          }개 실패)`
        );
      }
    } else {
      alert("방 삭제에 실패했습니다.");
    }
  };

  const handleFollowToggle = async () => {
    console.log("팔로우 버튼 클릭됨!");
    console.log("session?.user?.id:", session?.user?.id);
    console.log("user?.user_id:", user?.user_id);
    
    if (!session?.user?.id || !user?.user_id) {
      console.log("세션 또는 사용자 정보 없음 - 함수 종료");
      return;
    }
    
    console.log("팔로우 처리 시작, 현재 상태:", isFollowing ? "팔로잉 중" : "팔로우 안함");
    setFollowLoading(true);
    try {
      let success;
      if (isFollowing) {
        console.log("언팔로우 시도");
        success = await unfollowUser(user.user_id);
        if (success) {
          setIsFollowing(false);
          setFollowersCount(prev => prev - 1);
        }
      } else {
        console.log("팔로우 시도");
        success = await followUser(user.user_id);
        if (success) {
          setIsFollowing(true);
          setFollowersCount(prev => prev + 1);
        }
      }

      console.log("작업 결과:", success ? "성공" : "실패");
      if (!success) {
        alert("작업에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      alert("작업에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return <div className="px-40 py-5">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="px-40 py-5">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            사용자를 찾을 수 없습니다
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            요청하신 사용자 정보를 불러올 수 없습니다.
          </p>
        </div>
      </div>
    );
  }
  ///////////////////////////
  return (
    <div className="px-40 py-5">
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="flex items-center gap-6">
          {/* // 프로필 사진 부분 */}
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-orange-600 flex items-center justify-center overflow-hidden">
            {user.profile_image ? (
              <img
                src={user.profile_image}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-amber-700 dark:text-orange-200">
                {user.name?.[0]?.toUpperCase() || "?"}
              </span>
            )}
          </div>

          <div> {/* 공개 방 , 팔로워 , 팔로잉 파트 */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {user.display_name || user.name}
            </h1>
            <p className="text-amber-700 dark:text-orange-300 text-lg">
              @{user.name}
            </p>
            <div className="flex items-center gap-6 text-sm mt-2">
              <span className="text-gray-600 dark:text-gray-400">
                공개 방 {user.public_rooms_count}개
              </span>
              <button 
                onClick={() => {
                  setFollowModalTab("followers");
                  setFollowModalOpen(true);
                }}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                팔로워 <span className="font-semibold">{followersCount}</span>
              </button>
              <button 
                onClick={() => {
                  setFollowModalTab("following");
                  setFollowModalOpen(true);
                }}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                팔로잉 <span className="font-semibold">{followingCount}</span>
              </button>

                

            </div>
          </div>

          {/* 팔로우 버튼 (다른 사용자 프로필일 때만 표시) */}
          {session?.user?.id && session.user.id !== user.user_id && (
            <div className="mt-4">
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isFollowing
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    : "bg-amber-600 dark:bg-blue-500 text-white hover:bg-amber-700 dark:hover:bg-blue-700"
                } ${followLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {followLoading ? "처리 중..." : isFollowing ? "팔로잉" : "팔로우"}
              </button>
            </div>
          )}
        </div>




      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {user.display_name || user.name}님의 방들
          </h2>
          {isOwner && userRooms.length > 0 && (
            <div className="flex items-center gap-3">
              {isDeleteMode && (
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedRooms.size === 0}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedRooms.size === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : // 삭제할 방이 있을때
                        "bg-red-300 text-red-700 hover:bg-red-400"
                  }`}
                >
                  선택한 방 삭제 ({selectedRooms.size})
                </button>
              )}
              <button
                onClick={handleToggleDeleteMode}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isDeleteMode
                    ? "bg-gray-600 text-white hover:bg-gray-700"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                {isDeleteMode ? "취소" : <FaTrashCan size={20} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {userRooms.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-7 p-4">
          {userRooms.map((house: any) => (
            <div key={house.room_id} className="relative group">
              <HouseCard
                house={house}
                isDeleteMode={isDeleteMode}
                onThumbnailClick={() => handleRoomSelect(house.room_id)}
              />
              {isOwner && (
                <>
                  {isDeleteMode ? (
                    <div className="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={selectedRooms.has(house.room_id)}
                        onChange={() => handleRoomSelect(house.room_id)}
                        className="w-5 h-5 text-red-600 bg-white border-2 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditRoom(house)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <svg
                        className="w-4 h-4 text-gray-600 dark:text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            아직 공개된 방이 없습니다.
          </p>
        </div>
      )}

      {editingRoom && (
        <EditPopup
          initialTitle={editingRoom.title}
          initialDescription={editingRoom.description}
          initialIsPublic={editingRoom.is_public}
          onSave={handleSaveRoom}
          onDelete={handleDeleteRoom}
          onClose={() => setEditingRoom(null)}
        />
      )}

      <FollowsModal
        isOpen={followModalOpen}
        onClose={() => setFollowModalOpen(false)}
        initialTab={followModalTab}
        userId={user?.user_id}
      />
    </div>
  );
}
