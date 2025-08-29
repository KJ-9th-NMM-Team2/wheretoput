// POST /api/rooms/[id]/comments (코멘트 작성)
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";
export async function fetchPostComment(
): Promise<any> {
  const response = await fetch(
    `${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }/api/rooms?fields=${fields}&order=${order}`,
    {
      cache: "no-store",
    }
  );
  const rooms: any[] = await response.json();
  const data: any[] = rooms.map((room: any) => ({
    ...room,
    num_likes: room._count?.room_likes ?? 0,
    num_comments: room._count?.room_comments ?? 0,
    display_name: room.users.display_name,
  }));
  return data;
}