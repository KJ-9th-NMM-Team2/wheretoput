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
