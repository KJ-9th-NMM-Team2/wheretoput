import { fetchFollowers, fetchFollowing, fetchUserById, fetchUserRooms } from "@/lib/api/users";
import { useEffect } from "react";

export const useFetchFollowing = () => {
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
}