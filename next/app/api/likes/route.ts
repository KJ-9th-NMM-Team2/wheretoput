import { prisma } from "@/lib/prisma";
import { HttpResponse } from "@/utils/httpResponse";
import type { NextRequest } from "next/server";

interface LikeParams {
  params: { room_id: string; user_id: string };
}

/**
 * @swagger
 * /api/likes:
 *   post:
 *     tags:
 *       - Likes
 *     summary: 좋아요 추가/취소
 *     description: 특정 방에 좋아요를 추가하거나 취소합니다
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - room_id
 *               - user_id
 *             properties:
 *               room_id:
 *                 type: string
 *                 description: 방 ID
 *               user_id:
 *                 type: string
 *                 description: 사용자 ID
 *     responses:
 *       200:
 *         description: 좋아요 취소 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 action:
 *                   type: string
 *                   example: "unliked"
 *                 message:
 *                   type: string
 *                   example: "좋아요가 취소되었습니다"
 *       201:
 *         description: 좋아요 추가 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 action:
 *                   type: string
 *                   example: "liked"
 *                 message:
 *                   type: string
 *                   example: "좋아요가 추가되었습니다"
 *                 data:
 *                   type: object
 *       400:
 *         description: user_id가 필요합니다
 *       500:
 *         description: 서버 오류
 */
export async function POST(req: NextRequest) {
  try {
    const { room_id, user_id } = await req.json();
    console.log(room_id, user_id);

    if (!user_id) {
      return HttpResponse.badRequest("user_id가 요구됩니다");
    }

    const whereClause = {
      room_id_user_id: { room_id, user_id },
    };

    const existingLike = await prisma.room_likes.findUnique({
      where: whereClause,
    });

    if (existingLike) {
      // 좋아요 취소
      await prisma.room_likes.delete({
        where: whereClause,
      });
      return Response.json(
        { action: "unliked", message: "좋아요가 취소되었습니다" },
        { status: 200 }
      );
    }

    // 좋아요 추가
    const newLike = await prisma.room_likes.create({
      data: {
        room_id,
        user_id,
      },
    });

    return Response.json(
      { action: "liked", message: "좋아요가 추가되었습니다", data: newLike },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error handling like:", error);
    return HttpResponse.internalError();
  }
}

/**
 * @swagger
 * /api/likes:
 *   get:
 *     tags:
 *       - Likes
 *     summary: 좋아요 상태 확인
 *     description: 특정 사용자가 특정 방을 좋아요했는지 확인합니다
 *     parameters:
 *       - in: query
 *         name: room_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 방 ID
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 좋아요 상태 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liked:
 *                   type: boolean
 *                   description: 좋아요 여부
 *                   example: true
 *       400:
 *         description: user_id 및 room_id가 필요합니다
 *       500:
 *         description: 서버 오류
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    console.log(searchParams);
    const room_id = searchParams.get("room_id");
    const user_id = searchParams.get("user_id");
    console.log(room_id, user_id);

    if (!user_id || !room_id) {
      return Response.json(
        { error: "user_id 및 room_id가 요구됩니다" },
        { status: 400 }
      );
    }

    const existingLike = await prisma.room_likes.findUnique({
      where: {
        room_id_user_id: {
          room_id: room_id,
          user_id: user_id,
        },
      },
    });

    return Response.json({ liked: !!existingLike });
  } catch (error) {
    console.error("Error fetching like status:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
