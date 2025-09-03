import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /api/rooms/furnitures:
 *   put:
 *     tags:
 *       - 방 관리
 *     summary: 방 가구 업데이트
 *     description: 특정 방의 가구 구성을 업데이트합니다
 *     parameters:
 *       - in: query
 *         name: furnitures
 *         required: true
 *         schema:
 *           type: string
 *         description: 가구 구성 데이터
 *       - in: query
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: 방의 고유 식별자
 *     responses:
 *       200:
 *         description: 방 가구가 성공적으로 업데이트됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: 내부 서버 오류
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Internal Server Error
 */
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParmas = url.searchParams;
    const furnitures = searchParmas.get("furnitures");
    const roomId = searchParmas.get("roomId");

    // const result = prisma.rooms.find({
    //     where: {
    //         user_id: userId || undefined,
    //         room_id: roomId || undefined,
    //     },
    // })

    // return Response.json(result);
  } catch (error) {
    console.error("Error Check Own User Room:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
