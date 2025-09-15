import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /api/views:
 *   post:
 *     tags:
 *       - Room
 *     summary: 특정 방의 조회수를 증가시킵니다.
 *     description: 요청 본문에 포함된 `room_id`에 해당하는 방의 조회수(`view_count`)를 1 증가시킵니다.
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
 *                 description: 조회수를 증가시킬 방의 고유 ID
 *                 example: "room-abc-123"
 *     responses:
 *       '200':
 *         description: 조회수 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 views:
 *                   type: number
 *                   description: 업데이트된 방의 총 조회수
 *                   example: 101
 *       '400':
 *         description: 유효하지 않은 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "room_id가 필요합니다."
 *       '500':
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "조회수 업데이트 중 오류가 발생했습니다."
 */

export async function POST(req: Request) {
  const { room_id } = await req.json();

  const updated = await prisma.rooms.update({
    where: { room_id: room_id },
    data: { view_count: { increment: 1 } }, // 조회수 +1
  });

  return NextResponse.json({ views: updated.view_count });
}
