import { useState, useEffect } from "react";
import { fetchUserById, fetchUserRooms, fetchFollowers, fetchFollowing } from "@/lib/api/users";

interface UseFetchFollowingProps {
  params: Promise<{ id: string }>;
  session: any;
  setUser: (user: any) => void;
  setUserRooms: (rooms: any[]) => void;
  setIsOwner: (isOwner: boolean) => void;
  setFollowersCount: (count: number) => void;
  setFollowingCount: (count: number) => void;
  setIsFollowing: (isFollowing: boolean) => void;
  setLoading: (loading: boolean) => void;
}


export const useFetchFollowing = ({
  params,
  session,
  setUser,
  setUserRooms,
  setIsOwner,
  setFollowersCount,
  setFollowingCount,
  setIsFollowing,
  setLoading
}: UseFetchFollowingProps) => {
  
  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params;
      const { id } = resolvedParams;

      try {
        const userData = await fetchUserById(id);
        
        setUser(userData);

        const ownerStatus = session?.user?.id === id;
        setIsOwner(ownerStatus);

        const roomsData = await fetchUserRooms(id, "short", "new", ownerStatus);
        setUserRooms(roomsData);

        const followersData = await fetchFollowers(id);
        const followingData = await fetchFollowing(id);
        setFollowersCount(followersData.length);
        setFollowingCount(followingData.length);

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
  }, [params, session, setUser, setUserRooms, setIsOwner, setFollowersCount, setFollowingCount, setIsFollowing, setLoading]);
};