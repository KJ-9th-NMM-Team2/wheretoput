import { fetchRoomById } from "@/lib/api/room/rooms";

import RoomPageClient from "@/components/rooms/RoomPageClient";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const room: any = await fetchRoomById(id);
  return <RoomPageClient room={room} />;
}
