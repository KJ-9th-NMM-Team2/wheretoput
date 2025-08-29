import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

// GET /api/rooms/[id] (특정 집 데이터 가져오기)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    // users 모델의 display_name을 포함해서 가져오기 위해 include 사용
    const roomWithUser = await prisma.rooms.findUnique({
      where: {
        room_id: id,
      },

      include: {
        _count: {
          select: {
            room_comments: true,
            room_likes: true,
          },
        },
        users: {
          select: {
            display_name: true,
          },
        },
        room_comments: {
          include: {
            users: {
              select: {
                display_name: true,
              },
            },
          },
        },
      },
    });
    console.log("roomWithUser", roomWithUser);
    return Response.json(roomWithUser);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
