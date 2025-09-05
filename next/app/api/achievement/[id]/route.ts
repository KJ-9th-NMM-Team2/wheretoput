import { checkAchievement } from "@/lib/api/achievement/checkAchievement";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await checkAchievement(id);
    } catch (error) {
        console.error("Error check user achievement:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}