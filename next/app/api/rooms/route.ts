import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

// 리턴할 필드 결정용
function getSelectFields(fields: string | null) {
  const baseFields = {
    room_id: true,
    user_id: true,
    title: true,
    thumbnail_url: true,
    view_count: true,
    created_at: true,
    updated_at: true,
    is_public: true,
    collab_on: true,
    _count: {
      select: {
        room_comments: true,
        room_likes: true,
      },
    },
  };

  if (fields === "all") {
    return { ...baseFields };
  } else {
    return baseFields;
  }
}

// 순서 결정용
function getSelectOrder(
  order: string | null
): Prisma.roomsOrderByWithRelationInput {
  if (order === "view") return { view_count: Prisma.SortOrder.desc };
  else if (order === "new") return { created_at: Prisma.SortOrder.desc };
  else if (order === "like")
    return { room_likes: { _count: Prisma.SortOrder.desc } };
  else return { view_count: Prisma.SortOrder.desc };
}

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     tags:
 *       - rooms
 *     summary: Get rooms
 *     description: Retrieve a list of public rooms with optional filtering
 *     parameters:
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *           enum: [all]
 *         description: Select specific fields
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [view, new, like]
 *         description: Order by criteria
 *       - in: query
 *         name: num
 *         schema:
 *           type: integer
 *         description: Limit number of results
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Internal Server Error
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fields = searchParams.get("fields"); // fields 쿼리 파라미터
    const order = searchParams.get("order"); // order 쿼리 파라미터
    const num = searchParams.get("num"); // num 쿼리 파라미터

    // users 모델의 display_name을 포함해서 가져오기 위해 include 사용
    const roomsWithUser = await prisma.rooms.findMany({
      where: {
        is_public: true,
      },
      select: {
        ...getSelectFields(fields),
        user: {
          select: {
            name: true,
            display_name: true,
            id: true,
            image: true,
          },
        },
      },
      orderBy: getSelectOrder(order),
      ...(num ? { take: parseInt(num) } : {}),
    });
    return Response.json(roomsWithUser);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     tags:
 *       - rooms
 *     summary: Create a new room
 *     description: Create a new room for the authenticated user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Room title
 *               description:
 *                 type: string
 *                 description: Room description
 *               room_data:
 *                 type: object
 *                 description: Floor plan data
 *               is_public:
 *                 type: boolean
 *                 description: Whether the room is public
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 room_id:
 *                   type: string
 *                 message:
 *                   type: string
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal Server Error
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
    const { title, description, room_data, is_public = false } = body;

    // 필수 파라미터 확인
    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    // 트랜잭션을 사용하여 방과 벽 정보를 함께 저장
    const result = await prisma.$transaction(async (tx) => {
      // 새 방 생성
      const newRoom = await tx.rooms.create({
        data: {
          user_id: session.user.id,
          title,
          description,
          // room_data: room_data
          //   ? { pixelToMmRatio: room_data.pixelToMmRatio }
          //   : null,
          is_public,
          view_count: 0,
        },
      });

      // 벽 정보가 있으면 room_walls 테이블에 저장
      if (room_data?.walls && Array.isArray(room_data.walls)) {
        // 실제 축척 비율을 사용 (고정값 제거)
        const pixelToMmRatio = room_data.pixelToMmRatio || 1;

        // 축척을 1000배로 줄여서 적당한 크기로 조정
        const scaleAdjustment = pixelToMmRatio / 1000;

        console.log(
          `Using pixelToMmRatio: ${pixelToMmRatio}, scaleAdjustment: ${scaleAdjustment}`
        );

        const wallsData = room_data.walls.map((wall: any, index: number) => {
          const startX = wall.start.x * scaleAdjustment;
          const startY = wall.start.y * scaleAdjustment;
          const endX = wall.end.x * scaleAdjustment;
          const endY = wall.end.y * scaleAdjustment;

          // 벽의 길이 계산
          const length = Math.sqrt(
            Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
          );

          // 벽의 중점 계산 (원본 좌표 유지)
          const positionX = (startX + endX) / 2;
          const positionZ = (startY + endY) / 2;

          // 벽의 회전 계산 (Y축 회전)
          const rotationY = Math.atan2(endY - startY, endX - startX);

          console.log(
            `Wall ${index}: start(${startX.toFixed(2)}, ${startY.toFixed(
              2
            )}) end(${endX.toFixed(2)}, ${endY.toFixed(
              2
            )}) length=${length.toFixed(2)}`
          );

          return {
            room_id: newRoom.room_id,
            start_x: startX,
            start_y: startY,
            end_x: endX,
            end_y: endY,
            length: length,
            height: 2.5, // 기본 높이 2.5m (그대로 유지)
            depth: 0.15, // 기본 두께 15cm
            position_x: positionX,
            position_y: 1.25, // 벽 높이의 중점
            position_z: positionZ,
            rotation_x: 0,
            rotation_y: rotationY,
            rotation_z: 0,
            wall_order: index,
          };
        });

        // 벽 정보 일괄 삽입
        await tx.room_walls.createMany({
          data: wallsData,
        });
      }

      return newRoom;
    });

    return Response.json(
      {
        success: true,
        room_id: result.room_id,
        message: "Room created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating room:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
