// GET "/api/rooms" -> 집 데이터 가져오는 함수
export async function fetchRooms(
  fields: string = "short",
  order: string = "view",
  num: number | null = null
): Promise<any> {
  const params = new URLSearchParams({
    fields: fields,
    order: order,
    ...(num !== null && { num: num.toString() }),
  });

  const response = await fetch(
    `${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }/api/rooms?${params.toString()}`,
    {
      cache: "no-store",
    }
  );
  const rooms: any[] = await response.json();
  const data: any[] = rooms.map((room: any) => ({
    ...room,
    num_likes: room._count?.room_likes ?? 0,
    num_comments: room._count?.room_comments ?? 0,
  }));
  return data;
}

// GET "/api/rooms/id" -> 특정 집 데이터 가져오는 함수
export async function fetchRoomById(id: string): Promise<any> {
  const response = await fetch(
    `${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }/api/rooms/${id}`
  );
  const room: any = await response.json();
  const data: any = {
    ...room,
    num_likes: room._count?.room_likes ?? 0,
    num_comments: room._count?.room_comments ?? 0,
  };
  return data;
}
