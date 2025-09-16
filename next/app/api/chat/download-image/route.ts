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
 * /api/chat/download-image:
 *   get:
 *     tags:
 *       - Chat
 *     summary: S3에 저장된 이미지를 다운로드합니다.
 *     description: S3 키를 사용하여 지정된 이미지를 클라이언트에게 직접 다운로드할 수 있도록 제공합니다.
 *     parameters:
 *       - in: query
 *         name: s3Key
 *         schema:
 *           type: string
 *         required: true
 *         description: 다운로드할 이미지 파일의 S3 키
 *         example: "chat-images/example-image.jpg"
 *     responses:
 *       '200':
 *         description: 이미지 파일 다운로드 성공
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
 *                   example: "이미지 다운로드에 실패했습니다"
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const s3Key = searchParams.get('s3Key');

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

    // 파일명 생성
    const fileName = `chat-image-${Date.now()}.${s3Key.split('.').pop() || 'jpg'}`;

    // 다운로드 응답 반환
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': response.ContentType || 'image/jpeg',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('이미지 다운로드 오류:', error);
    return HttpResponse.internalError("이미지 다운로드에 실패했습니다")
  }
}