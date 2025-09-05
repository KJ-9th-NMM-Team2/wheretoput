import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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