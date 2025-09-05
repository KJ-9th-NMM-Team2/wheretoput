import { checkAchievement } from "@/lib/api/achievement/checkAchievement";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await checkAchievement(id);
        if (!result) {
            return new Response("Can not find achivements at all", {status: 404});
        }
        
        return Response.json(result);
    } catch (error) {
        console.error("Error check user achievement:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}