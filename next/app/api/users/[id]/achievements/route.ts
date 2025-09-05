import { NextRequest, NextResponse } from "next/server";
import { getUserAchievementsData } from "@/lib/api/achievements";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("achievement id", id);
    const achievements = await getUserAchievementsData(id);
    return NextResponse.json(achievements);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}