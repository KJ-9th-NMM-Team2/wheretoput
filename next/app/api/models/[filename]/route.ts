import { CACHE_DIR } from "@/lib/cache-utils";
import { NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";

// 로컬 서빙 파일
export async function GET(request: NextRequest, 
    {params} : {params: {filename: string}}
) {
    const filename = await params.filename;
    console.log('filename: ', filename);
    const filePath = `${CACHE_DIR}/${filename}`;
    try {
        const fileBuffer = await fs.readFile(filePath);
        // buffer를 Uint8Array로 변환
        return new Response(new Uint8Array(fileBuffer), {
            headers: {
                'Content-Type': 'model/gltf-binary',
                'Cache-Control': 'public, max-age=2592000', // 30일 캐시
            }
        });
    } catch (error) {
        return new Response('File not found', { status: 404 });
    }
}