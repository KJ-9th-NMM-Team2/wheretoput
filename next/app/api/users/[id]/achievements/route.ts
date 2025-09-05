import { NextRequest, NextResponse } from "next/server";
import { createAchievementsData, getUserAchievementsWithStatus } from "@/lib/api/achievement/achievements";

export async function POST(request: NextRequest) {
  try {
    const datas = await request.json();
    if (await createAchievementsData(datas)) {
      return NextResponse.json({message: "sccuesfully created", status:201});
    }

    return NextResponse.json("Create fail", {status: 500});
    
  } catch (error) {
    console.error("Error creating achievements:", error);
    return NextResponse.json(
      { error: "Failed to create achievements", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const achievements = await getUserAchievementsWithStatus(id);
    return NextResponse.json(achievements);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}

