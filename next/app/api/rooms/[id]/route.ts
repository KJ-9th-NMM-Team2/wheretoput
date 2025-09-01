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
 *       404:
 *         description: 방을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 *   put:
 *     tags:
 *       - rooms
 *     summary: 방 정보 수정
 *     description: 특정 방의 정보를 수정합니다
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 방 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: 방 제목
 *                 example: "우리집 거실"
 *               description:
 *                 type: string
 *                 description: 방 설명
 *                 example: "따뜻하고 아늑한 거실입니다"
 *               is_public:
 *                 type: boolean
 *                 description: 공개 여부
 *                 example: true
 *             required:
 *               - title
 *     responses:
 *       200:
 *         description: 방 정보 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 room_id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 is_public:
 *                   type: boolean
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: 방을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 *   delete:
 *     tags:
 *       - rooms
 *     summary: 방 삭제
 *     description: 특정 방을 삭제합니다 (관련된 모든 데이터도 함께 삭제됩니다)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 방 ID
 *     responses:
 *       200:
 *         description: 방 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 room_id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 deleted_at:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: 방을 찾을 수 없음
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
            image: true,
            id: true,
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
    if (!roomWithUser) {
      return new Response("Room not found", { status: 404 });
    }
    return Response.json(roomWithUser);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, description, is_public } = body;
    const updatedRoom = await prisma.rooms.update({
      where: { room_id: id },
      data: { title, description, is_public },
    });
    return Response.json(updatedRoom);
  } catch (error) {
    console.error("Error updating room:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const updatedRoom = await prisma.rooms.delete({
      where: { room_id: id },
    });
    return Response.json(updatedRoom);
  } catch (error) {
    console.error("Error deleting room:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
