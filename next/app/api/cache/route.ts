import { CACHE_DIR } from "@/lib/cache/CacheUtils";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";

// 여태까지 저장 되었던 파일들을 cached_model_url로 넣기 위함
async function GET() {
    try {
        // 디렉토리 내 파일 목록 가져오기
        const files = await fs.readdir(CACHE_DIR);

        // 각 파일의 상세 정보까지 원한다면
        const fileDetails = await Promise.all(
            files.map(async (file) => {
                const filePath = `${CACHE_DIR}/${file}`
                const stats = await fs.stat(filePath);
                return {
                    name: file.split(".")[0],
                    size: stats.size,
                    modified: stats.mtime,
                    isDirectory: stats.isDirectory()
                };
            })
        );

        const result = await Promise.all(
            fileDetails.map(async (detail) => {
                const filename = `${detail.name}.glb`;
                const filePath = `/cache/models/${filename}`;
                

                return await prisma.furnitures.update({
                    where: {furniture_id: detail.name},
                    data: {cached_model_url: filePath},
                })
            })
        );
        
        return Response.json({
            result: result,
            files: files,           // 파일명만
            details: fileDetails    // 상세 정보
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}