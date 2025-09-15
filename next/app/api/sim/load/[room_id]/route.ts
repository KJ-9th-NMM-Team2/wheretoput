import { prisma } from "@/lib/prisma";
import { extractRoomInfo } from "@/lib/services/simulator/extractRoomInfo";
import { objectTransformer } from "@/lib/services/simulator/objectTransformer";
import { wallsToProcessor } from "@/lib/services/simulator/wallsToProcessor";
import type { NextRequest } from "next/server";

// URL 접근 가능 여부 확인 함수
async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-cache",
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log(`URL not accessible: ${url}`, error.message);
    return false;
  }
}

/**
 * @swagger
 * /api/sim/load/{room_id}:
 *   get:
 *     tags:
 *       - sim (시뮬레이터)
 *     summary: 시뮬레이터 상태 로드
 *     description: 특정 방의 모든 가구 배치 정보를 로드합니다
 *     parameters:
 *       - in: path
 *         name: room_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 방 ID (UUID)
 *     responses:
 *       200:
 *         description: 로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 room_id:
 *                   type: string
 *                 objects:
 *                   type: array
 *                   description: 배치된 가구 정보 목록
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Three.js 객체 ID
 *                       object_id:
 *                         type: string
 *                         description: DB의 객체 ID
 *                       furniture_id:
 *                         type: string
 *                         description: 가구 ID (UUID)
 *                       position:
 *                         type: array
 *                         description: 위치 [x, y, z]
 *                         items:
 *                           type: number
 *                       rotation:
 *                         type: array
 *                         description: 회전 [x, y, z]
 *                         items:
 *                           type: number
 *                       scale:
 *                         type: array
 *                         description: 크기 [x, y, z]
 *                         items:
 *                           type: number
 *                       url:
 *                         type: string
 *                         description: 3D 모델 URL
 *                       isCityKit:
 *                         type: boolean
 *                         description: CityKit 모델 여부
 *                       texturePath:
 *                         type: string
 *                         description: 텍스처 경로
 *                       type:
 *                         type: string
 *                         description: 모델 타입
 *                 loaded_count:
 *                   type: integer
 *                   description: 로드된 객체 수
 *       400:
 *         description: 잘못된 요청
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

    const startTime = Date.now();
    // room_id 유효성 검사
    if (!room_id) {
      return Response.json({ error: "room_id is required" }, { status: 400 });
    }

    console.log(`Loading objects for room: ${room_id}`);

    // 쿼리 병렬 처리
    const [room, roomObjects, roomWalls] = await Promise.all([
      prisma.rooms.findUnique({ 
        where: { room_id },
        select: {
          title: true,
          description: true,
          is_public: true,
          updated_at: true,
          wall_color: true,
          floor_color: true,
          background_color: true,
          environment_preset: true,
        }
      }),
      prisma.room_objects.findMany({ 
        where: { room_id },
        include: {
          furnitures: {
            select: {
              furniture_id: true,
              name: true,
              model_url: true,
              category_id: true,
              length_x: true,
              length_y: true,
              length_z: true,
              cached_model_url: true,
            }
          },
        },
        orderBy: {
          created_at: "asc",
        },
      }),
      prisma.room_walls.findMany({
        where: { room_id },
        orderBy: {
          wall_order: "asc",
        }
      })
    ]);

    if (!room) {
      console.log(`Room not found: ${room_id}`);
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    console.log(
      `Found ${roomObjects.length} objects and ${roomWalls.length} walls for room ${room_id}`
    );

    // 시뮬레이터에서 사용할 형태로 데이터 변환
    const objects = await objectTransformer(roomObjects);

    // 벽 정보를 시뮬레이터 형태로 변환 (room_walls 또는 legacy data 사용)
    const wallsToProcess = roomWalls.length > 0 ? roomWalls : [];
    const walls = await wallsToProcessor(wallsToProcess);

    console.log(`최종 변환된 벽 개수: ${walls.length}`);

    // 벽, 바닥, 배경색 정보
    const result = await extractRoomInfo(room, objects, walls, room_id);

    return Response.json(result);
  } catch (error) {
    console.error("Error loading simulator state:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      roomId: room_id,
    });
    return Response.json(
      {
        error: "Internal Server Error",
        message: error.message,
        details:
          process.env.NODE_ENV === "development"
            ? error.stack
            : "Server error occurred",
        roomId: room_id,
      },
      { status: 500 }
    );
  }
}