"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import EditPopup from "@/components/sim/side/EditPopup";
import UserTabs from "@/components/users/components/UserTabs";
import UserNotFound from "@/components/users/UserNotFound";
import { FollowsModal } from "@/app/follows/page";
import { Follow } from "@/components/users/components/Follow";

import { useFetchFollowing } from "@/components/users/hooks/useFetchFollowing";
import { useRoomManagement } from "@/components/users/hooks/useRoomManagement";
import { useFollowLogic } from "@/components/users/hooks/useFollowLogic";

export default function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, setUser] = useState<any>(null);
  const [userRooms, setUserRooms] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<"followers" | "following">("followers");
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const { data: session } = useSession();

  // 1. 팔로워 목록 로딩 커스텀훅
  useFetchFollowing({
    params,
    session,
    setUser,
    setUserRooms,
    setIsOwner,
    setFollowersCount,
    setFollowingCount,
    setIsFollowing,
    setLoading
  });

  // 2. 방 삭제, 수정기능
  const {
    editingRoom,
    setEditingRoom,
    isDeleteMode,
    selectedRooms,
    setSelectedRooms,
    handleSaveRoom,
    handleDeleteRoom,
    handleToggleDeleteMode,
    handleBulkDelete
  } = useRoomManagement({ userRooms, setUserRooms });

  // 3. 팔로우 / 언팔로우 로직
  const {
    followLoading,
    handleFollowToggle
  } = useFollowLogic({
    user,
    session,
    isFollowing,
    setIsFollowing,
    setFollowersCount
  });

  if (loading) {
    return <div className="px-4 sm:px-8 lg:px-20 flex flex-1 justify-center py-3 sm:py-5">
      <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    </div>;
  }

  if (!user) {
    return <UserNotFound />;
  }
  return (
    <div className="px-4 sm:px-8 lg:px-20 flex flex-1 justify-center py-3 sm:py-5">
      <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
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
    </div>
  );
}
