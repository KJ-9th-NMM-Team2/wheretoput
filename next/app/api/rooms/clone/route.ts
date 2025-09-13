import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

/**
 * @swagger
 * /api/rooms/clone:
 *   post:
 *     tags:
 *       - Rooms
 *     summary: 기존 방 복제
 *     description: 
 *       주어진 `room_id`를 기반으로 기존 방을 복제하여 새로운 방을 생성합니다.  
 *       새 방은 비공개(`is_public: false`)로 생성되며, 원본 방의 `title`, `description`, `room_data`, `thumbnail_url` 등을 복사합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - room_id
 *             properties:
 *               room_id:
 *                 type: string
 *                 description: 복제할 방의 ID
 *                 example: "room_123"
 *     responses:
 *       201:
 *         description: 방 복제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 room_id:
 *                   type: string
 *                   example: "room_456"
 *                 message:
 *                   type: string
 *                   example: "Room cloned successfully"
 *       400:
 *         description: 필수 파라미터 누락 (`room_id` 없음)
 *       401:
 *         description: 인증 실패 (로그인 필요)
 *       404:
 *         description: 원본 방을 찾을 수 없음
 *       500:
 *         description: 서버 내부 오류
 */
export async function POST(req: NextRequest) {
  try {
    // 인증 확인
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { room_id } = body;

    // 필수 파라미터 확인
    if (!room_id) {
      return Response.json({ error: "Room ID is required" }, { status: 400 });
    }

    // 기존 방 정보
    const original_room = await prisma.rooms.findUnique({
      where: { room_id: room_id },
    });

    if (!original_room) {
      return Response.json(
        { error: "Original room not found" },
        { status: 404 }
      );
    }

    // 기존 방 정보를 복제하여 새로운 방을 생성
    const result = await prisma.$transaction(async (tx) => {
      // 새 방 생성
      const newRoom = await tx.rooms.create({
        data: {
          user_id: session?.user?.id,
          title: `${original_room?.title}의 복제본`,
          description: original_room?.description,
          room_data: original_room?.room_data
            ? { pixelToMmRatio: original_room?.room_data.pixelToMmRatio }
            : null,
          thumbnail_url: original_room?.thumbnail_url,
          is_public: false,
          view_count: 0,
          root_room_id: original_room?.root_room_id || original_room.room_id,
        },
      });

      return newRoom;
    });

    return Response.json(
      {
        success: true,
        room_id: result.room_id,
        message: "Room cloned successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error cloning room:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
