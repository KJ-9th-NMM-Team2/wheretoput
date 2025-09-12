import { CACHE_DIR } from "@/lib/cache/CacheUtils";
import { NextRequest } from "next/server";
import fs from "fs/promises";

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
    return new Response("File not found", { status: 404 });
  }
}
