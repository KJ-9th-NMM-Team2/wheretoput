// 작업중
// POST /api/rooms/[id]/comments (코멘트 작성)
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { user_id, content } = await req.json();

    if (!user_id || !content) {
      return new Response("Bad Request: Missing user_id or content", {
        status: 400,
      });
    }

    const newComment = await prisma.room_comments.create({
      data: {
        room_id: id,
        user_id,
        content,
      },
      include: {
        users: {
          select: {
            display_name: true,
          },
        },
      },
    });

    return Response.json(newComment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
