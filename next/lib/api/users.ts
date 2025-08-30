// GET "/api/users[id]/rooms" -> id를 통해 사용자의 방 목록 조회.
export async function fetchUserRooms(
  userId: string,
  fields: string = "short",
  order: string = "view",
  num: number | null = null
): Promise<any> {
  const params = new URLSearchParams({
    fields: fields,
    order: order,
    ...(num !== null && { num: num.toString() }),
  });

  const base_url = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${base_url}/api/users/${userId}/rooms?${params.toString()}`;

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
