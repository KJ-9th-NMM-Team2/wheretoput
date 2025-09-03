import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /api/rooms/user:
 *   get:
 *     tags:
 *       - 방 관리
 *     summary: 사용자의 방 정보 조회
 *     description: 특정 사용자의 방 정보를 조회합니다
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자의 고유 식별자
 *       - in: query
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: 방의 고유 식별자
 *     responses:
 *       200:
 *         description: 방 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                   description: 사용자 식별자
 *                 room_id:
 *                   type: string
 *                   description: 방 식별자
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   description: 방 생성 시간
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *                   description: 방 마지막 업데이트 시간
 *       500:
 *         description: 내부 서버 오류
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Internal Server Error
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParmas = url.searchParams;
    const userId = searchParmas.get("userId");
    const roomId = searchParmas.get("roomId");

    const result = await prisma.rooms.findUnique({
      where: {
        user_id: userId || undefined,
        room_id: roomId || undefined,
      },
    });

    return Response.json(result);
  } catch (error) {
    console.error("Error Check Own User Room:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
