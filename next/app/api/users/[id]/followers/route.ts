import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpResponse } from "@/utils/httpResponse";

/**
 * @swagger
 * /api/users/{id}/followers:
 * get:
 * tags:
 * - User
 * summary: 특정 사용자의 팔로워 목록을 조회합니다.
 * description: |
 * `id`에 해당하는 사용자의 팔로워 목록을 최신순으로 조회합니다.
 * 각 팔로워의 ID, 이름, 이메일, 프로필 이미지, 팔로우한 날짜를 반환합니다.
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: 사용자 ID (고유 식별자)
 * responses:
 * '200':
 * description: 성공적으로 팔로워 목록을 조회했습니다.
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * type: object
 * properties:
 * id:
 * type: string
 * example: "user-12345"
 * name:
 * type: string
 * example: "홍길동"
 * display_name:
 * type: string
 * example: "홍길동"
 * profile_image:
 * type: string
 * nullable: true
 * example: "https://example.com/profile.jpg"
 * followed_at:
 * type: string
 * format: date-time
 * example: "2023-10-27T10:00:00.000Z"
 * '500':
 * description: 서버 내부 오류
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * error:
 * type: string
 * example: "Internal server error"
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const followers = await prisma.follows.findMany({
      where: {
        following_id: id,
      },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const followersData = followers.map(follow => ({
      id: follow.follower.id,
      name: follow.follower.name,
      display_name: follow.follower.name,
      profile_image: follow.follower.image,
      followed_at: follow.created_at,
    }));

    return NextResponse.json(followersData);
  } catch (error) {
    console.error("Error fetching followers:", error);
    return HttpResponse.internalError();
  }
}