import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
) {
  try {
    const { room_id, walls } = await req.json();

    if (!walls) {
      return Response.json(
        { error: "walls are required" },
        { status: 400 }
      );
    }


    // 방이 존재하는지 확인
    const room = await prisma.rooms.findUnique({
      where: { room_id: room_id },
    });

    if (!room) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    // walls 데이터를 room_walls 테이블에 삽입
    await prisma.room_walls.createMany({
      data: walls.map((wall) => ({
        room_id: room_id,
        start_x: wall.start_x,
        start_y: wall.start_y,
        end_x: wall.end_x,
        end_y: wall.end_y,
        length: wall.length,
        height: wall.height,
        depth: wall.depth,
        position_x: wall.position_x,
        position_y: wall.position_y,
        position_z: wall.position_z,
        rotation_x: wall.rotation_x,
        rotation_y: wall.rotation_y,
        rotation_z: wall.rotation_z,
        wall_order: wall.wall_order,
        created_at: new Date(),
        updated_at: new Date(),
      })),
    });

    

    return Response.json({
      success: true,
      room_id: room_id,
      saved_count: walls.length,
      message: "Walls cloned successfully",
    });
  } catch (error) {
    console.error("Error cloning room walls:", error);
    return Response.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
