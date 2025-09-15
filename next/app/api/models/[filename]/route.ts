import { CACHE_DIR } from "@/lib/cache/CacheUtils";
import { NextRequest } from "next/server";
import fs from "fs/promises";
import { HttpResponse } from "@/utils/httpResponse";

/**
 * @swagger
 * /api/modles/{filename}:
 *   get:
 *     tags:
 *       - Files
 *     summary: 로컬에 파일 서빙
 *     description: 
 *       캐시 디렉토리(`CACHE_DIR`)에 저장된 `.glb` (glTF binary) 파일을 반환합니다.  
 *       파일이 존재하지 않으면 404 에러를 반환합니다.
 *     parameters:
 *       - name: filename
 *         in: path
 *         required: true
 *         description: 다운로드할 파일 이름 (예: `model.glb`)
 *         schema:
 *           type: string
 *           example: "example_model.glb"
 *     responses:
 *       200:
 *         description: 파일 다운로드 성공
 *         content:
 *           model/gltf-binary:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: 파일을 찾을 수 없음
 */

// 로컬에 파일 서빙하는 서비스 로직
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = await params;
  //console.log("filename: ", filename);

  const filePath = `${CACHE_DIR}/${filename}`;
  try {
    const fileBuffer = await fs.readFile(filePath);
    // buffer를 Uint8Array로 변환
    return new Response(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Cache-Control": "public, max-age=31536000", // 1년, 기존 한 달로 했으나 더 길게 잡으면 속도가 더 빨라진다고 함
      },
    });
  } catch (error) {
    return HttpResponse.notFound();
  }
}
