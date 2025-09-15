/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     tags:
 *       - comments
 *     summary: 댓글 수정
 *     description: 특정 댓글의 내용을 수정합니다
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 댓글 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: 수정할 댓글 내용
 *     responses:
 *       200:
 *         description: 댓글 수정 성공
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
import { prisma } from "@/lib/prisma";
import { HttpResponse } from "@/utils/httpResponse";
import type { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: comment_id } = params;
    const { content } = await req.json();

    if (!content) {
      return HttpResponse.badRequest("Missing content");
    }

    const newComment = await prisma.room_comments.update({
      where: {
        comment_id: comment_id,
      },
      data: {
        content,
        updated_at: new Date(),
      },
    });

    return Response.json(newComment, { status: 200 });
  } catch (error) {
    console.error("Error updating comment:", error);
    return HttpResponse.internalError();
  }
}

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     tags:
 *       - comments
 *     summary: 댓글 삭제
 *     description: 특정 댓글을 삭제합니다
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 댓글 ID
 *     responses:
 *       201:
 *         description: 댓글 삭제 성공
 *       500:
 *         description: 서버 오류
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: comment_id } = params;

    const newComment = await prisma.room_comments.delete({
      where: {
        comment_id: comment_id,
      },
    });

    return Response.json(newComment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
