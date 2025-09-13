import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


/**
 * @swagger
 * /api/users/{id}/following:
 * get:
 * tags:
 * - User
 * summary: 특정 사용자가 팔로우하는 사용자 목록을 조회합니다.
 * description: |
 * `id`에 해당하는 사용자가 팔로우하는 사용자 목록을 최신순으로 조회합니다.
 * 각 사용자의 ID, 이름, 이메일, 프로필 이미지, 팔로우를 시작한 날짜를 반환합니다.
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: 사용자 ID (고유 식별자)
 * responses:
 * '200':
 * description: 성공적으로 팔로우 목록을 조회했습니다.
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * type: object
 * properties:
 * id:
 * type: string
 * example: "user-67890"
 * name:
 * type: string
 * example: "김철수"
 * display_name:
 * type: string
 * example: "김철수"
 * profile_image:
 * type: string
 * nullable: true
 * example: "https://example.com/profile2.jpg"
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

    const following = await prisma.follows.findMany({
      where: {
        follower_id: id,
      },
      include: {
        following: {
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

    const followingData = following.map(follow => ({
      id: follow.following.id,
      name: follow.following.name,
      display_name: follow.following.name,
      profile_image: follow.following.image,
      followed_at: follow.created_at,
    }));

    return NextResponse.json(followingData);
  } catch (error) {
    console.error("Error fetching following:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}