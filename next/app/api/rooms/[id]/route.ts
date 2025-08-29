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
        user: {
          select: {
            name: true,
          },
        },
        room_objects: {
          include: {
            furnitures: {
              select: {
                furniture_id: true,
                name: true,
                description: true,
                image_url: true,
                price: true,
                brand: true,
              },
            },
          },
        },
        room_comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
        },
      },
    });
    return Response.json(roomWithUser);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
