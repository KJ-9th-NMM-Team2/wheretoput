import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import type { NextRequest } from "next/server";
import path from "path";

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

    // room_id 유효성 검사
    if (!room_id) {
      return Response.json({ error: "room_id is required" }, { status: 400 });
    }

    console.log(`Loading objects for room: ${room_id}`);

    // 1. 방이 존재하는지 확인
    console.log("Step 1: Checking if room exists...");
    const room = await prisma.rooms.findUnique({
      where: { room_id: room_id },
    });

    if (!room) {
      console.log(`Room not found: ${room_id}`);
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    console.log(`Room found: ${room.title}`);

    // 2. room_objects와 furniture 정보, 그리고 벽 정보를 함께 조회
    console.log("Step 2: Fetching room objects and walls...");
    const roomObjects = await prisma.room_objects.findMany({
      where: { room_id: room_id },
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
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });

    // 3. 벽 정보 조회
    console.log("Step 3: Fetching room walls...");
    const roomWalls = await prisma.room_walls.findMany({
      where: { room_id: room_id },
      orderBy: {
        wall_order: "asc",
      },
    });

    console.log(
      `Found ${roomObjects.length} objects and ${roomWalls.length} walls for room ${room_id}`
    );

    // // 각 객체의 furniture 관계 상태 확인
    // roomObjects.forEach((obj, index) => {
    //   console.log(
    //     `Object ${index}: furniture_id=${obj.furniture_id}, length: ${obj.furnitures.length_x}, ${obj.furnitures.length_y}, ${obj.furnitures.length_z}`
    //   );
    // });

    // // 벽 정보 로그
    // roomWalls.forEach((wall, index) => {
    //   console.log(
    //     `Wall ${index}: length=${wall.length}, position=(${wall.position_x}, ${wall.position_y}, ${wall.position_z})`
    //   );
    // });

    // 4. room_walls에 데이터가 없으면 rooms.room_data에서 fallback 시도
    let legacyWallsData = [];
    if (roomWalls.length === 0 && room.room_data) {
      console.log(
        "room_walls 테이블에 데이터가 없음. room_data에서 fallback 시도..."
      );
      const roomData = room.room_data as any;
      if (roomData.walls && Array.isArray(roomData.walls)) {
        console.log(`room_data에서 ${roomData.walls.length}개의 벽 발견`);

        // legacy 데이터를 room_walls 형식으로 변환
        const pixelToMmRatio = (roomData.pixelToMmRatio || 20) / 50;
        legacyWallsData = roomData.walls.map((wall: any, index: number) => {
          const startX = wall.start.x * pixelToMmRatio;
          const startY = wall.start.y * pixelToMmRatio;
          const endX = wall.end.x * pixelToMmRatio;
          const endY = wall.end.y * pixelToMmRatio;

          const length = Math.sqrt(
            Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
          );

          const positionX = (startX + endX) / 2;
          const positionZ = (startY + endY) / 2;
          const rotationY = Math.atan2(endY - startY, endX - startX);

          return {
            wall_id: `legacy-${index}`,
            start_x: startX,
            start_y: startY,
            end_x: endX,
            end_y: endY,
            length: length,
            height: 2.5,
            depth: 0.2,
            position_x: positionX,
            position_y: 1.25,
            position_z: positionZ,
            rotation_x: 0,
            rotation_y: rotationY,
            rotation_z: 0,
            wall_order: index,
          };
        });
      }
    }

    // 4. 시뮬레이터에서 사용할 형태로 데이터 변환
    const objects = await Promise.all(roomObjects.map(async (obj) => {
      // position JSON에서 값 추출
      const pos = obj.position as any;
      const rot = obj.rotation as any;
      const scale = obj.scale as any;

      // furniture_id가 null인 경우 (직접 업로드된 모델) 처리
      const hasFurniture = obj.furnitures && obj.furniture_id;
      // cached_model_url과 실제 파일 존재 여부 모두 체크
      let useCachedUrl = false;
      if (hasFurniture && obj.furnitures.cached_model_url) {
        const filePath = path.join('public', 'cache', 'models', obj.furnitures.cached_model_url);
        try {
          await fs.access(filePath);
          useCachedUrl = true;
          console.log(`🆚 Using cached file: ${filePath}`);
        } catch {
          console.log(`❌ Cached file not found, fallback to model_url: ${filePath}`);
        }
      }

      return {
        id: `object-${obj.object_id}`, // Three.js에서 사용할 고유 ID
        object_id: obj.object_id, // DB의 객체 ID
        furniture_id: obj.furniture_id,
        name: hasFurniture ? obj.furnitures.name : "Custom Object", // InfoPanel에서 사용하는 name 속성
        position: [pos?.x || 0, pos?.y || 0, pos?.z || 0],
        rotation: [rot?.x || 0, rot?.y || 0, rot?.z || 0],
        length: [
          Number(obj.furnitures?.length_x),
          Number(obj.furnitures?.length_y),
          Number(obj.furnitures?.length_z),
        ],
        scale: [scale?.x || 1, scale?.y || 1, scale?.z || 1],
        // furniture 테이블의 정보 활용 (furniture_id가 있는 경우만)
        url:
          hasFurniture && useCachedUrl
            ? obj.furnitures.cached_model_url
            : obj.furnitures.model_url
            ? obj.furnitures.model_url
            : "/legacy_mesh (1).glb",
        isCityKit: hasFurniture
          ? obj.furnitures.model_url?.includes("citykit") || false
          : false,
        texturePath: null, // texture_url 필드가 스키마에 없음
        type: hasFurniture
          ? obj.furnitures.model_url?.endsWith(".glb")
            ? "glb"
            : "building"
          : "custom",
        // 추가 메타데이터
        furnitureName: hasFurniture ? obj.furnitures.name : "Custom Object",
        categoryId: hasFurniture ? obj.furnitures.category_id : null,
      };
    }));

    // 5. 벽 정보를 시뮬레이터 형태로 변환 (room_walls 또는 legacy data 사용)
    const wallsToProcess = roomWalls.length > 0 ? roomWalls : legacyWallsData;
    const walls = wallsToProcess.map((wall) => ({
      id: `wall-${wall.wall_id}`,
      wall_id: wall.wall_id,
      start: { x: Number(wall.start_x), y: Number(wall.start_y) },
      end: { x: Number(wall.end_x), y: Number(wall.end_y) },
      length: Number(wall.length),
      height: Number(wall.height),
      depth: Number(wall.depth),
      position: [
        Number(wall.position_x),
        Number(wall.position_y),
        Number(wall.position_z),
      ],
      rotation: [
        Number(wall.rotation_x),
        Number(wall.rotation_y),
        Number(wall.rotation_z),
      ],
      wall_order: wall.wall_order,
    }));

    console.log(`최종 변환된 벽 개수: ${walls.length}`);

    // 6. 벽, 바닥, 배경색 정보
    const wall_color = room.wall_color || "#ffffff";
    const floor_color = room.floor_color || "#d2b48c";
    const background_color = room.background_color || "#87ceeb";
    const environment_preset = room.environment_preset || "apartment";
    const result: any = {
      success: true,
      room_id: room_id,
      objects: objects,
      walls: walls,
      loaded_count: objects.length,
      walls_count: walls.length,
      room_info: {
        title: room.title,
        description: room.description,
        is_public: room.is_public,
        updated_at: room.updated_at,
      },
      wall_color: wall_color,
      floor_color: floor_color,
      background_color: background_color,
      environment_preset: environment_preset,
    };
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
