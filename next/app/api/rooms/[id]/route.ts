import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

/**
 * @swagger
 * /api/rooms/{id}:
 *   get:
 *     tags:
 *       - rooms
 *     summary: 특정 방 정보 조회
 *     description: 특정 방의 상세 정보를 조회합니다 (사용자, 가구, 댓글 포함)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 방 ID
 *     responses:
 *       200:
 *         description: 방 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 room_id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 thumbnail_url:
 *                   type: string
 *                 view_count:
 *                   type: integer
 *                 _count:
 *                   type: object
 *                 user:
 *                   type: object
 *                 room_objects:
 *                   type: array
 *                 room_comments:
 *                   type: array
 *       500:
 *         description: 서버 오류
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
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
