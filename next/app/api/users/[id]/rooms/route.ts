import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { HttpResponse } from "@/utils/httpResponse";

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
 * /api/users/{id}/rooms:
 *   get:
 *     tags:
 *       - users
 *       - rooms
 *     summary: 사용자의 방 목록 조회
 *     description: 특정 사용자가 생성한 공개 방 목록을 조회합니다
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *           enum: [all]
 *         description: 반환할 필드 선택
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [view, new, like]
 *         description: 정렬 기준 (조회수, 최신순, 좋아요순)
 *       - in: query
 *         name: num
 *         schema:
 *           type: integer
 *         description: 결과 제한 개수
 *     responses:
 *       200:
 *         description: 성공적인 응답
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   room_id:
 *                     type: string
 *                     description: 방 고유 식별자
 *                   user_id:
 *                     type: string
 *                     description: 방 생성자 ID
 *                   title:
 *                     type: string
 *                     description: 방 제목
 *                   thumbnail_url:
 *                     type: string
 *                     description: 썸네일 이미지 URL
 *                   view_count:
 *                     type: integer
 *                     description: 조회수
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     description: 생성일
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 *                     description: 수정일
 *                   user:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: 사용자명
 *                   _count:
 *                     type: object
 *                     properties:
 *                       room_comments:
 *                         type: integer
 *                         description: 댓글 수
 *                       room_likes:
 *                         type: integer
 *                         description: 좋아요 수
 *       500:
 *         description: 내부 서버 오류
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(req.url);
    const fields = searchParams.get("fields");
    const order = searchParams.get("order");
    const num = searchParams.get("num");
    const showPrivate = searchParams.get("showPrivate") === "true";

    const roomsWithUser = await prisma.rooms.findMany({
      where: {
        user_id: userId,
        is_public: showPrivate ? undefined : true,
      },
      select: {
        ...getSelectFields(fields),
        user: {
          select: {
            name: true,
            display_name: true,
            image: true,
          },
        },
      },
      orderBy: getSelectOrder(order),
      ...(num ? { take: parseInt(num) } : {}),
    });

    return Response.json(roomsWithUser);
  } catch (error) {
    console.error("Error fetching user rooms:", error);
    return HttpResponse.internalError();
  }
}
