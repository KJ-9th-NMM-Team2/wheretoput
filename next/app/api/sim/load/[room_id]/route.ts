import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

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
      return Response.json(
        { error: "room_id is required" },
        { status: 400 }
      );
    }

    console.log(`Loading objects for room: ${room_id}`);

    // 1. 방이 존재하는지 확인
    console.log('Step 1: Checking if room exists...');
    const room = await prisma.rooms.findUnique({
      where: { room_id: room_id }
    });

    if (!room) {
      console.log(`Room not found: ${room_id}`);
      return Response.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }
    
    console.log(`Room found: ${room.title}`);

    // 2. room_objects와 furniture 정보를 함께 조회
    console.log('Step 2: Fetching room objects...');
    const roomObjects = await prisma.room_objects.findMany({
      where: { room_id: room_id },
      include: {
        furnitures: {
          select: {
            furniture_id: true,
            name: true,
            model_url: true,
            category_id: true
          }
        }
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    console.log(`Found ${roomObjects.length} objects for room ${room_id}`);
    
    // 각 객체의 furniture 관계 상태 확인
    roomObjects.forEach((obj, index) => {
      console.log(`Object ${index}: furniture_id=${obj.furniture_id}, has_furnitures=${!!obj.furnitures}`);
    });

    // 3. 시뮬레이터에서 사용할 형태로 데이터 변환
    const objects = roomObjects.map((obj) => {
      // position JSON에서 값 추출
      const pos = obj.position as any;
      const rot = obj.rotation as any;
      const scale = obj.scale as any;

      // furniture_id가 null인 경우 (직접 업로드된 모델) 처리
      const hasFurniture = obj.furnitures && obj.furniture_id;

      return {
        id: `object-${obj.object_id}`, // Three.js에서 사용할 고유 ID
        object_id: obj.object_id, // DB의 객체 ID
        furniture_id: obj.furniture_id,
        name: hasFurniture ? obj.furnitures.name : 'Custom Object', // InfoPanel에서 사용하는 name 속성
        position: [
          pos?.x || 0,
          pos?.y || 0,
          pos?.z || 0
        ],
        rotation: [
          rot?.x || 0,
          rot?.y || 0,
          rot?.z || 0
        ],
        scale: [
          scale?.x || 1,
          scale?.y || 1,
          scale?.z || 1
        ],
        // furniture 테이블의 정보 활용 (furniture_id가 있는 경우만)
        url: hasFurniture ? obj.furnitures.model_url : '/models/default.glb',
        isCityKit: hasFurniture ? (obj.furnitures.model_url?.includes('citykit') || false) : false,
        texturePath: null, // texture_url 필드가 스키마에 없음
        type: hasFurniture ? (obj.furnitures.model_url?.endsWith('.glb') ? 'glb' : 'building') : 'custom',
        // 추가 메타데이터
        furnitureName: hasFurniture ? obj.furnitures.name : 'Custom Object',
        categoryId: hasFurniture ? obj.furnitures.category_id : null
      };
    });

    return Response.json({
      success: true,
      room_id: room_id,
      objects: objects,
      loaded_count: objects.length,
      room_info: {
        title: room.title,
        updated_at: room.updated_at
      }
    });

  } catch (error) {
    console.error("Error loading simulator state:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      roomId: room_id
    });
    return Response.json(
      {
        error: "Internal Server Error",
        message: error.message,
        details: process.env.NODE_ENV === "development" ? error.stack : "Server error occurred",
        roomId: room_id
      },
      { status: 500 }
    );
  }
}