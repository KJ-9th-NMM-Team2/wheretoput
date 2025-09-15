import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { HttpResponse } from '@/utils/httpResponse';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * @swagger
 * /api/chat/image/{s3Key}:
 *   get:
 *     tags:
 *       - S3
 *     summary: S3에 저장된 이미지를 직접 표시합니다.
 *     description: |
 *       URL 경로에 포함된 `s3Key`에 해당하는 이미지를 S3 버킷에서 가져와 웹 브라우저에 직접 표시할 수 있는 `inline` 형태로 반환합니다.
 *       이 API는 이미지 다운로드가 아닌, 이미지 태그(`<img>`)의 `src` 속성에 사용하기 적합합니다.
 *     parameters:
 *       - in: path
 *         name: s3Key
 *         required: true
 *         schema:
 *           type: string
 *         description: 표시할 이미지 파일의 URL 인코딩된 S3 키
 *         example: "chat-images%2Fexample-image.jpg"
 *     responses:
 *       '200':
 *         description: 이미지 파일 조회 성공
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       '400':
 *         description: 유효하지 않은 요청 (S3 키 누락)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "S3 키가 필요합니다"
 *       '404':
 *         description: 이미지를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "이미지를 찾을 수 없습니다"
 *       '500':
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "이미지를 불러올 수 없습니다"
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { s3Key: string } }
) {
  try {
    const s3Key = decodeURIComponent(params.s3Key);
    console.log('요청된 S3 키:', s3Key);

    if (!s3Key) {
      return HttpResponse.unAuthorized("S3 키가 필요합니다");
    }

    // S3에서 이미지 가져오기
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: s3Key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      return HttpResponse.notFound("이미지를 찾을 수 없습니다");
    }

    // Stream을 Buffer로 변환
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToWebStream().getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const buffer = Buffer.concat(chunks);

    // 이미지 표시용 응답 반환 (다운로드가 아닌 inline)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': response.ContentType || 'image/jpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // 1년 캐시
      },
    });

  } catch (error) {
    console.error('이미지 표시 오류:', error);
    return HttpResponse.internalError("이미지를 불러올 수 없습니다");
  }
}