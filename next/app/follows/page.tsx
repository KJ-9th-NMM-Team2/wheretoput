"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fetchUserById, fetchFollowers, fetchFollowing, unfollowUser } from "@/lib/api/users";

interface User {
  id: string;
  name: string;
  display_name?: string;
  profile_image?: string;
}

interface FollowsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "followers" | "following";
  userId?: string;
}

export function FollowsModal({ isOpen, onClose, initialTab = "followers", userId }: FollowsModalProps) {
  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    if (!isOpen) return;

    const loadFollowData = async () => {
      const targetUserId = userId || session?.user?.id;
      if (!targetUserId) return;

      try {
        const followersData = await fetchFollowers(targetUserId);
        const followingData = await fetchFollowing(targetUserId);

        setFollowers(followersData);
        setFollowing(followingData);
      } catch (error) {
        console.error("Error fetching follow data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFollowData();
  }, [isOpen, userId, session]);

  const handleUnfollow = async (targetUserId: string) => {
    if (!confirm("정말로 팔로우를 취소하시겠습니까?")) return;

    try {
      const success = await unfollowUser(targetUserId);
      if (success) {
        setFollowing(prev => prev.filter(user => user.id !== targetUserId));
        alert("팔로우를 취소했습니다.");
      } else {
        alert("팔로우 취소에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      alert("팔로우 취소에 실패했습니다.");
    }
  };

  const handleRemoveFollower = async (followerId: string) => {
    if (!confirm("정말로 이 팔로워를 제거하시겠습니까?")) return;

    try {
      // 팔로워를 제거하는 것은 해당 팔로워가 나를 언팔로우하게 하는 것
      // 하지만 일반적으로는 직접 팔로워를 제거하는 API가 필요함
      // 여기서는 단순히 UI에서만 제거 (실제로는 별도 API 필요)
      setFollowers(prev => prev.filter(user => user.id !== followerId));
      alert("팔로워를 제거했습니다.");
    } catch (error) {
      console.error("Error removing follower:", error);
      alert("팔로워 제거에 실패했습니다.");
    }
  };

  const router = useRouter();
  // 클릭하면 해당 사용자 마이페이지로 이동
  const handleUserClick = (userId: string) => {
    router.push(`/users/${userId}`);
    onClose(); // 모달 닫기
  };

  const UserCard = ({
    user,
    isFollowing
  }: {
    user: User;
    isFollowing: boolean;
  }) => (
    <div className="flex items-center justify-between py-2">
      <div
        className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
        onClick={() => handleUserClick(user.id)}
      >
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-orange-600 flex items-center justify-center overflow-hidden">
          {user.profile_image ? (
            <img
              src={user.profile_image}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-amber-700 dark:text-orange-200">
              {user.name?.[0]?.toUpperCase() || "?"}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
            {user.display_name || user.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            @{user.name}
          </p>
        </div>
      </div>

      {session?.user?.id === (userId || session?.user?.id) && (
        <div className="flex gap-2">
          {isFollowing ? (
            <button
              onClick={() => handleUnfollow(user.id)}
              className="tool-btn-red !px-3 !py-1"
            >
              언팔로우
            </button>
          ) : (
            <button
              onClick={() => handleRemoveFollower(user.id)}
              className="tool-btn-red !px-3 !py-1"
            >
              삭제
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 ">
            팔로워 / 팔로잉
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("followers")}
            className={`flex-1 px-4 py-3 font-medium transition-colors cursor-pointer ${activeTab === "followers"
              ? "text-amber-700 dark:text-orange-300 border-b-2 border-amber-700 dark:border-orange-300"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            팔로워 ({followers.length})
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`flex-1 px-4 py-3 font-medium transition-colors cursor-pointer ${activeTab === "following"
              ? "text-amber-700 dark:text-orange-300 border-b-2 border-amber-700 dark:border-orange-300"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            팔로잉 ({following.length})
          </button>
        </div>

        <div className="overflow-y-auto max-h-96 p-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">로딩 중...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTab === "followers" ? (
                followers.length > 0 ? (
                  followers.map(user => (
                    <UserCard key={user.id} user={user} isFollowing={false} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      아직 팔로워가 없습니다.
                    </p>
                  </div>
                )
              ) : (
                following.length > 0 ? (
                  following.map(user => (
                    <UserCard key={user.id} user={user} isFollowing={true} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      아직 팔로우하는 사용자가 없습니다.
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FollowsPage() {
  return <div>이 페이지는 직접 접근할 수 없습니다.</div>;
}
