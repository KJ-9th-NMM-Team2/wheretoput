import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { HttpResponse } from "@/utils/httpResponse";

/**
 * @swagger
 * /api/users/{id}/follow:
 *   post:
 *     tags:
 *       - User
 *     summary: 사용자를 팔로우합니다.
 *     description: |
 *       로그인된 사용자가 `id`에 해당하는 사용자를 팔로우합니다.
 *       이미 팔로우 중이면 400 에러를 반환합니다.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 팔로우할 사용자의 ID
 *         schema:
 *           type: string
 *           example: "user123"
 *     responses:
 *       200:
 *         description: 팔로우 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: 이미 팔로우 중인 사용자이거나 자기 자신을 팔로우하는 경우
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Already following this user"
 *       401:
 *         description: 인증되지 않은 사용자
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return HttpResponse.unAuthorized();
    }

    const { id: targetUserId } = await params;
    const followerId = session.user.id;

    // 자기 자신을 팔로우하는 것 방지
    if (followerId === targetUserId) {
      return HttpResponse.badRequest("Cannot follow yourself");
    }

    // 이미 팔로우 중인지 확인
    const existingFollow = await prisma.follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: followerId,
          following_id: targetUserId,
        },
      },
    });

    if (existingFollow) {
      return HttpResponse.badRequest("Already following this user");
    }

    // 팔로우 추가
    await prisma.follows.create({
      data: {
        follower_id: followerId,
        following_id: targetUserId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error following user:", error);
    return HttpResponse.internalError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return HttpResponse.unAuthorized();
    }

    const { id: targetUserId } = await params;
    const followerId = session.user.id;

    // 팔로우 관계 삭제
    const deletedFollow = await prisma.follows.deleteMany({
      where: {
        follower_id: followerId,
        following_id: targetUserId,
      },
    });

    if (deletedFollow.count === 0) {
      return HttpResponse.notFound("Follow relationship not found");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return HttpResponse.internalError();
  }
}