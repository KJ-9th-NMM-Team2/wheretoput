import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { HttpResponse } from "@/utils/httpResponse";

// MIME 타입 설정 함수
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.glb') return 'model/gltf-binary';
  if (ext === '.gltf') return 'model/gltf+json';
  if (ext === '.bin') return 'application/octet-stream';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';

  return 'application/octet-stream';
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: filePath } = await params;

    if (!filePath || filePath.length === 0) {
      return HttpResponse.badRequest("File path is required");
    }

    // 보안: path traversal 방지
    const sanitizedPath = filePath.filter(segment =>
      segment &&
      !segment.includes('..') &&
      !segment.includes('/') &&
      !segment.includes('\\')
    );

    if (sanitizedPath.length !== filePath.length) {
      return HttpResponse.badRequest("Invalid file path");
    }

    // public/cache/models 디렉토리 내의 파일만 접근 허용
    const fullPath = path.join(process.cwd(), 'public', 'cache', 'models', ...sanitizedPath);

    // 파일이 실제로 cache/models 디렉토리 안에 있는지 확인
    const cacheModelsDir = path.join(process.cwd(), 'public', 'cache', 'models');
    const resolvedPath = path.resolve(fullPath);
    const resolvedCacheDir = path.resolve(cacheModelsDir);

    if (!resolvedPath.startsWith(resolvedCacheDir)) {
      return HttpResponse.forbidden();
    }

    // 파일 존재 여부 확인 및 fallback 처리
    if (!fs.existsSync(fullPath)) {
      // 캐시 파일이 없으면 DB에서 원본 URL 찾아서 프록시
      try {
        const cachedPath = `/cache/models/${sanitizedPath.join('/')}`;

        console.log(`Cache file not found: ${fullPath}, searching DB for original URL`);

        // cached_model_url로 furniture 찾기
        const furniture = await prisma.furnitures.findFirst({
          where: {
            cached_model_url: cachedPath
          },
          select: {
            model_url: true,
            name: true
          }
        });

        if (!furniture || !furniture.model_url) {
          console.log(`No original URL found for cached file: ${cachedPath}`);
          return HttpResponse.notFound();
        }

        console.log(`Found original URL: ${furniture.model_url} for ${furniture.name}`);

        // 원본 URL에서 파일 가져오기
        const response = await fetch(furniture.model_url);

        if (!response.ok) {
          console.log(`Failed to fetch original file: ${furniture.model_url}`);
          return HttpResponse.notFound("Original file not accessible");
        }

        const fileBuffer = await response.arrayBuffer();
        const contentType = getMimeType(furniture.model_url);

        console.log(`Serving original file as fallback: ${furniture.model_url}`);

        return new Response(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Length': fileBuffer.byteLength.toString(),
            'Cache-Control': 'public, max-age=3600' // 원본 파일은 1시간 캐시
          }
        });

      } catch (error) {
        console.log(`Error handling cache miss: ${error.message}`);
        return HttpResponse.internalError();
      }
    }

    // 파일 읽기
    const fileBuffer = fs.readFileSync(fullPath);
    const contentType = getMimeType(fullPath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000' // 1년 캐시
      }
    });

  } catch (error) {
    console.error("Error serving cached model file:", error);
    return HttpResponse.internalError(error.message);
  }
}