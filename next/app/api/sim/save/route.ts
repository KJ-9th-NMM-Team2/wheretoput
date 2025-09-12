import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";

/**
 * @swagger
 * /api/sim/save:
 *   post:
 *     tags:
 *       - sim (시뮬레이터)
 *     summary: 시뮬레이터 상태 저장
 *     description: 현재 시뮬레이터의 모든 가구 배치 정보를 데이터베이스에 저장합니다
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               room_id:
 *                 type: string
 *                 description: 방 ID
 *               objects:
 *                 type: array
 *                 description: 배치된 가구 정보 목록
 *                 items:
 *                   type: object
 *                   properties:
 *                     furniture_id:
 *                       type: string
 *                       description: 가구 ID (UUID)
 *                     position:
 *                       type: array
 *                       description: 위치 [x, y, z]
 *                       items:
 *                         type: number
 *                     rotation:
 *                       type: array
 *                       description: 회전 [x, y, z] (라디안)
 *                       items:
 *                         type: number
 *                     scale:
 *                       type: array
 *                       description: 크기 [x, y, z]
 *                       items:
 *                         type: number
 *                     url:
 *                       type: string
 *                       description: 3D 모델 URL
 *                     isCityKit:
 *                       type: boolean
 *                       description: CityKit 모델 여부
 *                     texturePath:
 *                       type: string
 *                       description: 텍스처 경로
 *                     type:
 *                       type: string
 *                       description: 모델 타입
 *     responses:
 *       200:
 *         description: 저장 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 saved_count:
 *                   type: integer
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 오류
 */
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

    let body;
    try {
      body = await req.json();
      // console.log("body:", body);
    } catch (error) {
      console.error("JSON parsing error:", error);
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const {
      room_id,
      objects,
      wallColor,
      floorColor,
      backgroundColor,
      environmentPreset,
    } = body;

    // 필수 파라미터 확인
    if (!room_id || !objects || !Array.isArray(objects)) {
      return Response.json(
        { error: "room_id and objects array are required" },
        { status: 400 }
      );
    }

    console.log(`Saving ${objects.length} objects for room ${room_id}`);

    // 트랜잭션으로 처리
    await prisma.$transaction(async (tx) => {
      // 1. 기존 room_objects 삭제 (해당 room_id의 모든 가구)
      await tx.room_objects.deleteMany({
        where: { room_id: room_id },
      });

      console.log(`Deleted existing objects for room ${room_id}`);

      // 2. 새로운 room_objects 생성 (furniture_id가 있는 객체만)
      const validObjects = objects.filter((obj: any) => obj.furniture_id);

      if (validObjects.length > 0) {
        const roomObjects = validObjects.map((obj: any) => ({
          object_id: crypto.randomUUID(), // UUID 생성
          room_id: room_id,
          furniture_id: obj.furniture_id, // furniture_id는 필수
          position: {
            x: obj.position[0],
            y: obj.position[1],
            z: obj.position[2],
            rotation: obj.rotation[1] || 0, // Y축 회전값 포함
          },
          rotation: {
            x: obj.rotation[0] || 0,
            y: obj.rotation[1] || 0,
            z: obj.rotation[2] || 0,
          },
          scale: {
            x: obj.scale[0],
            y: obj.scale[1],
            z: obj.scale[2],
          },
          created_at: new Date(),
          updated_at: new Date(),
        }));

        await tx.room_objects.createMany({
          data: roomObjects,
        });

        console.log(
          `Created ${roomObjects.length} new objects for room ${room_id}`
        );
      }

      if (objects.length > validObjects.length) {
        console.log(
          `Skipped ${
            objects.length - validObjects.length
          } objects without furniture_id`
        );
      }

      // 3. rooms 테이블의 updated_at 및 색상 갱신 (room이 존재하는 경우만)
      try {
        await tx.rooms.update({
          where: { room_id: room_id },
          data: {
            updated_at: new Date(),
            wall_color: wallColor,
            floor_color: floorColor,
            background_color: backgroundColor,
            environment_preset: environmentPreset,
          },
        });
      } catch (roomUpdateError) {
        console.warn(
          `Room ${room_id} not found in rooms table, skipping room update`
        );
        // room이 없어도 가구 저장은 계속 진행
      }
    });

    const validObjectsCount = objects.filter(
      (obj: any) => obj.furniture_id
    ).length;
    const skippedCount = objects.length - validObjectsCount;

    return Response.json({
      success: true,
      message: `Successfully saved ${validObjectsCount} objects${
        skippedCount > 0
          ? ` (skipped ${skippedCount} without furniture_id)`
          : ""
      }`,
      saved_count: validObjectsCount,
      skipped_count: skippedCount,
    });
  } catch (error) {
    console.error("Error saving simulator state:", error);
    return Response.json(
      {
        error: "Internal Server Error",
        message: error.message,
        details:
          process.env.NODE_ENV === "development"
            ? error.stack
            : "Server error occurred",
      },
      { status: 500 }
    );
  }
}
