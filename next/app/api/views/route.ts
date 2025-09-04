import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { room_id } = await req.json();

  const updated = await prisma.rooms.update({
    where: { room_id: room_id },
    data: { view_count: { increment: 1 } }, // 조회수 +1
  });

  return NextResponse.json({ views: updated.view_count });
}
