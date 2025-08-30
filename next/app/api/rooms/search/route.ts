import { prisma } from "@/lib/prisma";
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
  console.log("=== API 호출됨 ===");
    console.log("전체 URL:", req.url);

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const fields = searchParams.get("fields"); // fields 쿼리 파라미터
    const order = searchParams.get("order"); // order 쿼리 파라미터
    const num = searchParams.get("num"); // num 쿼리 파라미터

    console.log(fields);
    console.log(order);
    console.log(getSelectOrder(order));
    if (!query?.trim()) {
      return Response.json([]);
    }

    const rooms = await prisma.rooms.findMany({
      where: {
        OR: [
          {
            title: {
              startsWith: query,
              mode: 'insensitive'
            }
          },
          {
            user: {
              name: {
                startsWith: query,
                mode: 'insensitive'
              }
            }
          }
        ],
      },
      select: {
        ...getSelectFields(fields),
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: getSelectOrder(order),
      ...(num ? { take: parseInt(num) } : {}),
    });
    return Response.json(rooms);

  } catch (error) {
    console.error("Error fetching rooms:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
