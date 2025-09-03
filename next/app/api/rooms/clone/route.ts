import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // 인증 확인
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { room_id } = body;

    // 필수 파라미터 확인
    if (!room_id) {
      return Response.json({ error: "Room ID is required" }, { status: 400 });
    }

    // 기존 방 정보
    const original_room = await prisma.rooms.findUnique({
      where: { room_id: room_id },
    });

    if (!original_room) {
      return Response.json(
        { error: "Original room not found" },
        { status: 404 }
      );
    }

    // 기존 방 정보를 복제하여 새로운 방을 생성
    const result = await prisma.$transaction(async (tx) => {
      // 새 방 생성
      const newRoom = await tx.rooms.create({
        data: {
          user_id: session?.user?.id,
          title: `${original_room?.title}의 복제본`,
          description: original_room?.description,
          room_data: original_room?.room_data
            ? { pixelToMmRatio: original_room?.room_data.pixelToMmRatio }
            : null,
          thumbnail_url: original_room?.thumbnail_url,
          is_public: false,
          view_count: 0,
          root_room_id: original_room?.root_room_id || original_room.room_id,
        },
      });

      return newRoom;
    });

    return Response.json(
      {
        success: true,
        room_id: result.room_id,
        message: "Room cloned successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error cloning room:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
