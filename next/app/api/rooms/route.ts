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

// GET /api/rooms (DB의 집 데이터 가져오기)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fields = searchParams.get("fields"); // fields 쿼리 파라미터
    const order = searchParams.get("order"); // order 쿼리 파라미터
    const num = searchParams.get("num"); // num 쿼리 파라미터
    console.log({ fields, order, num });

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
