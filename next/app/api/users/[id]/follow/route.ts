import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: targetUserId } = await params;
    const followerId = session.user.id;

    // 자기 자신을 팔로우하는 것 방지
    if (followerId === targetUserId) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: "Follow relationship not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}