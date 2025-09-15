import { CACHE_DIR } from "@/lib/cache/CacheUtils";
import { prisma } from "@/lib/prisma";
import { HttpResponse } from "@/utils/httpResponse";
import fs from "fs/promises";

/**
 * @swagger
 * /api/cache:
 * get:
 * tags:
 * - Cache
 * summary: 로컬 캐시된 모델을 DB에 업데이트
 * description: 서버의 캐시 디렉토리(`CACHE_DIR`)에 저장된 3D 모델 파일(.glb)을 확인하고, 해당 파일 경로를 `prisma.furnitures` 테이블의 `cached_model_url` 필드에 업데이트합니다.
 * responses:
 * 200:
 * description: 업데이트 성공
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * result:
 * type: array
 * description: Prisma 업데이트 결과 배열
 * items:
 * type: object
 * files:
 * type: array
 * description: 캐시 디렉토리의 파일명 목록
 * items:
 * type: string
 * details:
 * type: array
 * description: 파일 상세 정보 배열
 * items:
 * type: object
 * properties:
 * name:
 * type: string
 * size:
 * type: number
 * modified:
 * type: string
 * format: date-time
 * isDirectory:
 * type: boolean
 * 500:
 * description: 서버 오류
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * error:
 * type: string
 * description: 오류 메시지
 */

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
        return HttpResponse.internalError(error.message);
    }
}