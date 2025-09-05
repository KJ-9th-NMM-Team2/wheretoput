import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}