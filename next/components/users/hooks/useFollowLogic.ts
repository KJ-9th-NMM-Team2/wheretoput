import { useState } from "react";
import { followUser, unfollowUser } from "@/lib/api/users";

interface UseFollowLogicProps {
  user: any;
  session: any;
  isFollowing: boolean;
  setIsFollowing: (value: boolean) => void;
  setFollowersCount: (updater: (prev: number) => number) => void;
}

export const useFollowLogic = ({
  user,
  session,
  isFollowing,
  setIsFollowing,
  setFollowersCount
}: UseFollowLogicProps) => {
  const [followLoading, setFollowLoading] = useState(false);

  const handleFollowToggle = async () => {
    if (!session?.user?.id || !user?.user_id) {
      return;
    }
    
    setFollowLoading(true);
    try {
      let success;
      if (isFollowing) {
        success = await unfollowUser(user.user_id);
        if (success) {
          setIsFollowing(false);
          setFollowersCount(prev => prev - 1);
        }
      } else {
        success = await followUser(user.user_id);
        if (success) {
          setIsFollowing(true);
          setFollowersCount(prev => prev + 1);
        }
      }

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

  return {
    followLoading,
    handleFollowToggle
  };
};