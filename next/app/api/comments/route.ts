/**
 * @swagger
 * /api/comments:
 *   post:
 *     tags:
 *       - comments
 *     summary: 댓글 작성
 *     description: 특정 방에 댓글을 작성합니다
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - room_id
 *               - user_id
 *               - content
 *             properties:
 *               room_id:
 *                 type: string
 *                 description: 방 ID
 *               user_id:
 *                 type: string
 *                 description: 사용자 ID
 *               content:
 *                 type: string
 *                 description: 댓글 내용
 *     responses:
 *       201:
 *         description: 댓글 작성 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { room_id, user_id, content } = await req.json();
    // console.log(room_id, user_id, content);

    if (!user_id || !content) {
      return new Response("Bad Request: Missing user_id or content", {
        status: 400,
      });
    }

    const newComment = await prisma.room_comments.create({
      data: {
        room_id,
        user_id,
        content,
      },
    });

    return Response.json(newComment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
