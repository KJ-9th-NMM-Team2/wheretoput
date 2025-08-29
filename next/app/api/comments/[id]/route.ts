// PUT api/comments/[id] (특정 코멘트 수정)
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: comment_id } = params;
    const { content } = await req.json();

    if (!content) {
      return new Response("Bad Request: Missing content", {
        status: 400,
      });
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
    return new Response("Internal Server Error", { status: 500 });
  }
}

// DELETE api/comments/[id] (특정 코멘트 삭제)
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
