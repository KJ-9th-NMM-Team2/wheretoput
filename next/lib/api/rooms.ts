// GET "/api/rooms" -> 집 데이터 가져오는 함수
// GET "/api/rooms/search/q -> 검색 데이터 가져오는 함수
export async function fetchRooms(
  fields: string = "short",
  order: string = "view",
  num: number | null = null,
  query: string = ""
): Promise<any> {
  const params = new URLSearchParams({
    fields: fields,
    order: order,
    ...(num !== null && { num: num.toString() }),
    q: query,
  });

  console.log("fiels check: ", fields);
  console.log("order check: ", order);
  const base_url = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  console.log(base_url);
  const url = query
    ? `${base_url}/api/rooms/search/?${params.toString()}`
    : `${base_url}/api/rooms?${params.toString()}`;

  const response = await fetch(url, {
    cache: "no-store",
  });
  const rooms: any[] = await response.json();
  const data: any[] = rooms.map((room: any) => ({
    ...room,
    num_likes: room._count?.room_likes ?? 0,
    num_comments: room._count?.room_comments ?? 0,
  }));
  console.log(data);
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
