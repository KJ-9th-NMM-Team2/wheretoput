import { prisma } from "@/lib/prisma";
import { HttpResponse } from "@/utils/httpResponse";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const datas = await request.json();
        const furniture_id = datas.furniture_id;
        const localPath = datas.localPath.replace("public", "");

        const response = await prisma.furnitures.update({
            where: { furniture_id },
            data: { cached_model_url: localPath }
        })

        if (!response) {
            return HttpResponse.notFound("가구의 아이디가 정확하지 않습니다.")
        } 
        return HttpResponse.success({ success: true });
    } catch (error) {
        return HttpResponse.internalError(error.message);
    }
}