// GET "/api/users[id]/rooms" -> id를 통해 사용자의 방 목록 조회.
export async function fetchUserRooms(
  userId: string,
  fields: string = "short",
  order: string = "view",
  showPrivate: boolean = false,
  num: number | null = null
): Promise<any> {
  const params = new URLSearchParams({
    fields: fields,
    order: order,
    ...(num !== null && { num: num.toString() }),
  });

  const base_url = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${base_url}/api/users/${userId}/rooms?${params.toString()}&showPrivate=${showPrivate}`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  const rooms: any[] = await response.json();
  const data: any[] = rooms.map((room: any) => ({
    ...room,
    num_likes: room._count?.room_likes ?? 0,
    num_comments: room._count?.room_comments ?? 0,
  }));

  return data;
}

// GET "/api/users/[id]" -> id를 통해 사용자 정보 확인.
export async function fetchUserById(userId: string): Promise<any> {
  const base_url = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${base_url}/api/users/${userId}`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  const user = await response.json();
  return user;
}

// GET "/api/users/[id]/followers" -> 사용자의 팔로워 목록 조회
export async function fetchFollowers(userId: string): Promise<any[]> {
  const base_url = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${base_url}/api/users/${userId}/followers`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch followers");
  }

  return response.json();
}

// GET "/api/users/[id]/following" -> 사용자가 팔로우하는 목록 조회
// 비동기 , 성공 여부 true/false
export async function fetchFollowing(userId: string): Promise<any[]> {
  const base_url = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${base_url}/api/users/${userId}/following`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch following");
  }

  return response.json();
}

// POST "/api/users/[id]/follow" -> 사용자 팔로우
export async function followUser(userId: string): Promise<boolean> {
  try {
    const base_url = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${base_url}/api/users/${userId}/follow`;

    console.log("팔로우 요청:", url);
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("팔로우 응답:", response.status, response.ok);
    if (!response.ok) {
      const errorData = await response.text();
      console.error("팔로우 실패:", errorData);
    }

    return response.ok;
  } catch (error) {
    console.error("Error following user:", error);
    return false;
  }
}

// DELETE "/api/users/[id]/follow" -> 사용자 언팔로우
export async function unfollowUser(userId: string): Promise<boolean> {
  try {
    const base_url = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${base_url}/api/users/${userId}/follow`;

    const response = await fetch(url, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return false;
  }
}

// 팔로우 상태 확인
export async function checkFollowStatus(userId: string): Promise<boolean> {
  try {
    const following = await fetchFollowing("current-user"); // 현재 사용자가 팔로우하는 목록
    return following.some(user => user.id === userId);
  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
}
