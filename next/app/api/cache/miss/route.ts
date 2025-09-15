import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        console.log("데이터가 들어오나?");
        const datas = await request.json();
        const furniture_id = datas.furniture_id;
        const localPath = datas.localPath.replace("public", "");

        console.log("localPath check", localPath);
        const response = await prisma.furnitures.update({
            where: { furniture_id },
            data: { cached_model_url: localPath }
        })

        if (!response) {
            return Response.json("가구의 아이디가 정확하지 않습니다.", { status: 404 })
        } 
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}