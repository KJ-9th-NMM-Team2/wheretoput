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

    // 새 방 생성
    const newRoom = await prisma.rooms.create({
      data: {
        user_id: session.user.id,
        title,
        description,
        room_data,
        is_public,
        view_count: 0,
      },
    });

    return Response.json(
      {
        success: true,
        room_id: newRoom.room_id,
        message: "Room created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating room:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
