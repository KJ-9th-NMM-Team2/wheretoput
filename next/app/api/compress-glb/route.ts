import { NextRequest } from "next/server";
import path from "path";
import fs from "fs-extra";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  draco,
  weld,
  dedup,
  prune,
  textureCompress,
} from "@gltf-transform/functions";
import sharp from "sharp";
import draco3d from "draco3d";
import { HttpResponse } from "@/utils/httpResponse";

/**
 * @swagger
 * /api/compress-glb:
 *   post:
 *     tags:
 *       - 3D Model
 *     summary: 지정된 파일의 GLB 파일을 압축합니다.
 *     description: 요청 본문으로 제공된 디렉토리 경로에 있는 모든 GLB 파일을 gltf-pipeline 압축 라이브러리를 사용하여 최적화합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filePath
 *             properties:
 *               filePath:
 *                 type: string
 *                 description: 압축할 GLB 파일이 포함된 디렉토리의 절대 경로
 *                 example: /path/to/your/glb/files
 *     responses:
 *       '200':
 *         description: 압축 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: GLB 파일 압축이 완료되었습니다.
 *                 compressedCount:
 *                   type: number
 *                   description: 압축에 성공한 파일의 수
 *       '400':
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 디렉토리 경로가 필요합니다.
 *       '405':
 *         description: 허용되지 않는 HTTP 메서드
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Method not allowed
 *       '500':
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 압축 처리 중 오류가 발생했습니다.
 *                 details:
 *                   type: string
 *                   example: '압축 라이브러리 실행 실패'
 */

// Pages Router 방식
export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return HttpResponse.methodNotAllowed();
  }

  const data = await req.json();
  const filePath = data.filePath;

  if (!filePath) {
    return HttpResponse.badRequest("디렉토리 경로가 필요합니다.");
  }

  try {
    const result = await compressGlbFiles(filePath);
    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error("GLB 압축 오류:", error);
    return HttpResponse.internalError("압축 처리 중 오류가 발생했습니다.");
  }
}

async function compressWithDraco(
  inputPath: string,
  outputPath: string = inputPath
) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

  try {
    // 배포 환경 호환을 위한 Draco 모듈 설정
    const decoderWasmCandidate = path.join(process.cwd(), "public/draco/draco_decoder.wasm");
    const decoderWasmExists = await fs.pathExists(decoderWasmCandidate);
    const decoderWasmPath = decoderWasmExists
      ? decoderWasmCandidate
      : path.join(process.cwd(), "node_modules/draco3d/draco_decoder.wasm");

    const encoderWasmCandidate = path.join(process.cwd(), "public/draco/draco_encoder.wasm");
    const encoderWasmExists = await fs.pathExists(encoderWasmCandidate);
    const encoderWasmPath = encoderWasmExists
      ? encoderWasmCandidate
      : path.join(process.cwd(), "node_modules/draco3d/draco_encoder.wasm");

    await io.registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule({
        wasmBinary: await fs.readFile(decoderWasmPath),
      }),
      "draco3d.encoder": await draco3d.createEncoderModule({
        wasmBinary: await fs.readFile(encoderWasmPath),
      }),
    });

    // 압축 전 파일 크기 미리 저장
    const originalStats = await fs.stat(inputPath);

    // GLB 파일 로드
    const document = await io.read(inputPath);

    // 최대 압축을 위한 최적화 (Draco만 사용)
    await document.transform(
      // 중복 버텍스 병합
      weld(),
      // 중복 제거
      dedup(),
      // 텍스처 최적화
      textureCompress({
        encoder: sharp,
        targetFormat: "webp",
        quality: 80, // 가구 텍스처 품질을 위해 약간 상향
        effort: 4, // 압축 속도와 효율의 균형
        resize: [1024, 1024, { fit: "inside" }],
      }),
      // 사용하지 않는 리소스 제거
      prune(),
      // Draco 압축 적용 (최대 압축 + 빠른 로딩)
      draco({
        quantizePosition: 16,
        quantizeNormal: 12,
        quantizeTexcoord: 10,
        quantizeColor: 8,
        quantizeGeneric: 12,
        encodeSpeed: 5, // 최대 압축 (느린 인코딩)
        decodeSpeed: 10, // 최고 로딩 속도
      })
    );

    // 압축된 파일 저장
    await io.write(outputPath, document);

    console.log(`Compressed with Draco: ${path.basename(outputPath)}`);

    // 파일 크기 비교
    const compressedStats = await fs.stat(outputPath);
    const compressionRatio = (
      ((originalStats.size - compressedStats.size) / originalStats.size) *
      100
    ).toFixed(1);

    console.log(`  Original: ${(originalStats.size / 1024).toFixed(1)}KB`);
    console.log(`  Compressed: ${(compressedStats.size / 1024).toFixed(1)}KB`);
    console.log(`  Compression: ${compressionRatio}% reduction`);

    return {
      inputPath,
      outputPath,
      originalSize: originalStats.size,
      compressedSize: compressedStats.size,
      compressionRatio: parseFloat(compressionRatio),
    };
  } catch (error) {
    console.error("Error during Draco compression:", error);
    throw error;
  }
}

// 공통 압축 로직
async function compressGlbFiles(filePath: string) {
  try {
    if (!filePath) {
      return { message: "GLB 파일이 없습니다.", processed: 0 };
    }

    console.log(`${filePath} GLB 파일 압축 시작`);

    // 절대 경로로 변환
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    try {
      console.log(`압축 중: ${absolutePath}`);

      // gltf-transform을 사용하여 압축 (같은 파일에 덮어쓰기)
      const result = await compressWithDraco(absolutePath, absolutePath);

      console.log(`완료: ${absolutePath}`);
      console.log(`압축률: ${result.compressionRatio}% 감소`);

      return {
        message: "GLB 압축 완료",
        successful: 1,
        failed: 0,
        compressionRatio: result.compressionRatio,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        results: [
          {
            filePath: absolutePath,
            success: true,
            compressionRatio: result.compressionRatio,
          },
        ],
      };
    } catch (error) {
      console.error(`실패: ${absolutePath}`, error.message);
      return {
        message: "GLB 압축 실패",
        successful: 0,
        failed: 1,
        results: [
          { filePath: absolutePath, success: false, error: error.message },
        ],
      };
    }
  } catch (error) {
    console.log(`압축 처리 실패: ${error.message}`);
  }
}
