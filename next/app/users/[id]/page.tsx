"use client";

import { fetchUserById, fetchUserRooms, fetchFollowers, fetchFollowing, followUser, unfollowUser } from "@/lib/api/users";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import EditPopup from "@/components/sim/side/EditPopup";
import { updateRoomInfo, deleteRoom } from "@/lib/roomService";
import UserTabs from "@/components/users/components/UserTabs";

import { FollowsModal } from "@/app/follows/page";
import { Follow } from "@/components/users/components/Follow";

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
      <Follow 
        user={user}
        followersCount={followersCount}
        followingCount={followingCount}
        isFollowing={isFollowing}
        followLoading={followLoading}
        session={session}
        setFollowModalTab={setFollowModalTab}
        setFollowModalOpen={setFollowModalOpen}
        handleFollowToggle={handleFollowToggle}
      />

      <UserTabs 
        user={user} 
        userRooms={userRooms}
        isOwner={isOwner}
        isDeleteMode={isDeleteMode}
        selectedRooms={selectedRooms}
        handleToggleDeleteMode={handleToggleDeleteMode}
        handleBulkDelete={handleBulkDelete}
        setSelectedRooms={setSelectedRooms}
        setEditingRoom={setEditingRoom}
      />

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
