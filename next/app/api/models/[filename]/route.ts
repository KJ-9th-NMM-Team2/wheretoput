import { CACHE_DIR } from "@/lib/cache-utils";
import { NextRequest } from "next/server";
import fs from "fs/promises";

// 로컬 서빙 파일
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const a_params = await params;
  const filename = a_params.filename;
  console.log("filename: ", filename);
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
