// POST /api/comments (코멘트 작성)
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { room_id, user_id, content } = await req.json();
    console.log(room_id, user_id, content);

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
