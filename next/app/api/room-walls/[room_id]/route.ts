import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

/**
 * @swagger
 * /api/room-walls/{room_id}:
 *   get:
 *     tags:
 *       - room-walls
 *     summary: 방의 벽 데이터 조회
 *     description: 특정 방의 모든 벽 정보를 조회합니다
 *     parameters:
 *       - in: path
 *         name: room_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 방 ID (UUID)
 *     responses:
 *       200:
 *         description: 벽 데이터 조회 성공
 *       404:
 *         description: 방을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ room_id: string }> }
) {
  try {
    const { room_id } = await params;

    console.log(`Fetching walls for room: ${room_id}`);

    // 방이 존재하는지 확인
    const room = await prisma.rooms.findUnique({
      where: { room_id: room_id }
    });

    if (!room) {
      return Response.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // 방의 벽 데이터 조회
    const walls = await prisma.room_walls.findMany({
      where: { room_id: room_id },
      orderBy: { wall_order: 'asc' }
    });

    console.log(`Found ${walls.length} walls for room ${room_id}`);

    // 3D 벽 형태로 변환
    const walls3D = walls.map((wall) => ({
      id: `wall-${wall.wall_id}`,
      position: [
        Number(wall.position_x),
        Number(wall.position_y),
        Number(wall.position_z)
      ],
      rotation: [
        Number(wall.rotation_x),
        Number(wall.rotation_y),
        Number(wall.rotation_z)
      ],
      dimensions: {
        width: Number(wall.length),
        height: Number(wall.height),
        depth: Number(wall.depth)
      },
      material: 'wall',
      original2D: {
        start: { x: Number(wall.start_x), y: Number(wall.start_y) },
        end: { x: Number(wall.end_x), y: Number(wall.end_y) }
      }
    }));

    return Response.json({
      success: true,
      room_id: room_id,
      walls: walls3D,
      wall_count: walls3D.length
    });

  } catch (error) {
    console.error("Error fetching room walls:", error);
    return Response.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/room-walls/{room_id}:
 *   post:
 *     tags:
 *       - room-walls
 *     summary: 방의 벽 데이터 저장
 *     description: 특정 방에 벽 정보를 저장합니다 (기존 벽들은 삭제됨)
 *     parameters:
 *       - in: path
 *         name: room_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 방 ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               walls:
 *                 type: array
 *                 description: 벽 데이터 배열
 *               pixelToMmRatio:
 *                 type: number
 *                 description: 픽셀-mm 비율
 *     responses:
 *       200:
 *         description: 벽 데이터 저장 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 방을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ room_id: string }> }
) {
  try {
    const { room_id } = await params;
    const { walls, pixelToMmRatio } = await req.json();

    if (!walls || !pixelToMmRatio) {
      return Response.json(
        { error: "walls and pixelToMmRatio are required" },
        { status: 400 }
      );
    }

    console.log(`Saving ${walls.length} walls for room ${room_id}`);

    // 방이 존재하는지 확인
    const room = await prisma.rooms.findUnique({
      where: { room_id: room_id }
    });

    if (!room) {
      return Response.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // 트랜잭션으로 기존 벽들 삭제 후 새로 추가
    await prisma.$transaction(async (tx) => {
      // 기존 벽들 삭제
      await tx.room_walls.deleteMany({
        where: { room_id: room_id }
      });

      // 벽 데이터 변환 및 중심점 계산
      const wallsData = walls.map((wall, index) => {
        // 픽셀 좌표를 미터 단위로 변환
        const startX = wall.start.x * pixelToMmRatio / 1000;
        const startZ = wall.start.y * pixelToMmRatio / 1000;
        const endX = wall.end.x * pixelToMmRatio / 1000;
        const endZ = wall.end.y * pixelToMmRatio / 1000;
        
        // 벽의 길이와 중심점 계산
        const length = Math.sqrt(
          Math.pow(endX - startX, 2) + Math.pow(endZ - startZ, 2)
        );
        const centerX = (startX + endX) / 2;
        const centerZ = (startZ + endZ) / 2;
        const rotation = Math.atan2(endZ - startZ, endX - startX);
        
        return {
          start_x: startX,
          start_y: startZ,
          end_x: endX,
          end_y: endZ,
          length: length,
          position_x: centerX,
          position_z: centerZ,
          rotation_y: rotation,
          wall_order: index
        };
      });

      // 벽들의 중심점 계산하여 원점 중심으로 이동
      if (wallsData.length > 0) {
        const centerX = wallsData.reduce((sum, wall) => sum + wall.position_x, 0) / wallsData.length;
        const centerZ = wallsData.reduce((sum, wall) => sum + wall.position_z, 0) / wallsData.length;
        
        // 모든 벽의 위치를 중심점 기준으로 조정
        wallsData.forEach(wall => {
          wall.position_x -= centerX;
          wall.position_z -= centerZ;
          wall.start_x -= centerX;
          wall.start_y -= centerZ;
          wall.end_x -= centerX;
          wall.end_y -= centerZ;
        });
      }

      // 새로운 벽들 추가
      await tx.room_walls.createMany({
        data: wallsData.map(wall => ({
          room_id: room_id,
          start_x: wall.start_x,
          start_y: wall.start_y,
          end_x: wall.end_x,
          end_y: wall.end_y,
          length: wall.length,
          position_x: wall.position_x,
          position_z: wall.position_z,
          rotation_y: wall.rotation_y,
          wall_order: wall.wall_order
        }))
      });
    });

    console.log(`Successfully saved ${walls.length} walls for room ${room_id}`);

    return Response.json({
      success: true,
      room_id: room_id,
      saved_count: walls.length,
      message: "Walls saved successfully"
    });

  } catch (error) {
    console.error("Error saving room walls:", error);
    return Response.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}