import { prisma } from "@/lib/prisma";
import { HttpResponse } from "@/utils/httpResponse";
import type { NextRequest } from "next/server";

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - users
 *     summary: 사용자 정보 조회
 *     description: 특정 사용자의 상세 정보를 조회합니다
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 성공적인 응답
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                   description: 고유 사용자 식별자
 *                 name:
 *                   type: string
 *                   description: 사용자명
 *                 display_name:
 *                   type: string
 *                   description: 표시 이름
 *                 profile_image:
 *                   type: string
 *                   description: 프로필 이미지 URL
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   description: 사용자 생성일
 *                 public_rooms_count:
 *                   type: integer
 *                   description: 사용자가 생성한 공개 방 수
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 내부 서버 오류
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const user = await prisma.User.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        display_name: true,
        email: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            rooms: {
              where: {
                is_public: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return HttpResponse.notFound("User not Found");
    }

    return Response.json({
      user_id: user.id,
      name: user.name,
      display_name: user.display_name,
      email: user.email,
      profile_image: user.image,
      created_at: user.createdAt,
      public_rooms_count: user._count.rooms,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return HttpResponse.internalError();
  }
}

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - users
 *     summary: 사용자 닉네임 업데이트
 *     description: 특정 사용자의 display_name을 업데이트합니다
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               display_name:
 *                 type: string
 *                 description: 새로운 표시 이름
 *     responses:
 *       200:
 *         description: 성공적인 업데이트
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 display_name:
 *                   type: string
 *                 profile_image:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 public_rooms_count:
 *                   type: integer
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 내부 서버 오류
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await req.json();
    const { display_name } = body;

    if (typeof display_name !== 'string') {
      return HttpResponse.badRequest("display_name must be a string");
    }

    const user = await prisma.User.update({
      where: {
        id: userId,
      },
      data: {
        display_name: display_name.trim() || null,
      },
      select: {
        id: true,
        name: true,
        display_name: true,
        email: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            rooms: {
              where: {
                is_public: true,
              },
            },
          },
        },
      },
    });

    return Response.json({
      user_id: user.id,
      name: user.name,
      display_name: user.display_name,
      email: user.email,
      profile_image: user.image,
      created_at: user.createdAt,
      public_rooms_count: user._count.rooms,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return HttpResponse.internalError();
  }
}
