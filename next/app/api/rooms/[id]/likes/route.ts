import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

type LikeParams = {
  params: Promise<{ id: string }>;
};

// GET /api/rooms/[id]/likes (좋아요 여부 확인하기)
export async function GET(req: NextRequest, { params }: LikeParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json({ error: "userId가 요구됩니다" }, { status: 400 });
    }

    const existingLike = await prisma.room_likes.findUnique({
      where: {
        room_id_user_id: {
          room_id: id,
          user_id: userId,
        },
      },
    });

    return Response.json({ liked: !!existingLike });
  } catch (error) {
    console.error("Error fetching like status:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/rooms/[id]/likes (좋아요 달기/취소)
export async function POST(req: NextRequest, { params }: LikeParams) {
  try {
    const { id } = await params;
    const { user_id } = await req.json();

    console.log("user_id", user_id, "room_id", id);
    if (!user_id) {
      return Response.json({ error: "user_id가 요구됩니다" }, { status: 400 });
    }

    const whereClause = {
      room_id_user_id: { room_id: id, user_id },
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
        room_id: id,
        user_id,
      },
    });

    return Response.json(
      { action: "liked", message: "좋아요가 추가되었습니다", data: newLike },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error handling like:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
