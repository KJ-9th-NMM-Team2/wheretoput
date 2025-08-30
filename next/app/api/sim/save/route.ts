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

    const body = await req.json();
    const { room_id, objects } = body;

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
        where: { room_id: room_id }
      });

      console.log(`Deleted existing objects for room ${room_id}`);

      // 2. 새로운 room_objects 생성
      if (objects.length > 0) {
        const roomObjects = objects.map((obj: any) => ({
          object_id: crypto.randomUUID(), // UUID 생성
          room_id: room_id,
          furniture_id: obj.furniture_id || null, // UUID 문자열
          position: {
            x: obj.position[0],
            y: obj.position[1], 
            z: obj.position[2],
            rotation: obj.rotation[1] || 0 // Y축 회전값 포함
          },
          rotation: {
            x: obj.rotation[0] || 0,
            y: obj.rotation[1] || 0,
            z: obj.rotation[2] || 0
          },
          scale: {
            x: obj.scale[0],
            y: obj.scale[1],
            z: obj.scale[2]
          },
          created_at: new Date(),
          updated_at: new Date()
        }));

        await tx.room_objects.createMany({
          data: roomObjects
        });

        console.log(`Created ${roomObjects.length} new objects for room ${room_id}`);
      }

      // 3. rooms 테이블의 updated_at 갱신
      await tx.rooms.update({
        where: { room_id: room_id },
        data: { updated_at: new Date() }
      });
    });

    return Response.json({
      success: true,
      message: `Successfully saved ${objects.length} objects`,
      saved_count: objects.length
    });

  } catch (error) {
    console.error("Error saving simulator state:", error);
    return Response.json(
      {
        error: "Internal Server Error",
        message: error.message,
        details: process.env.NODE_ENV === "development" ? error.stack : "Server error occurred"
      },
      { status: 500 }
    );
  }
}