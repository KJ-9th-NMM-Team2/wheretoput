import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';
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
 * /api/chat/upload-image:
 *   post:
 *     tags:
 *       - Chat
 *     summary: 이미지를 S3 버킷에 업로드합니다.
 *     description: 클라이언트로부터 받은 이미지 파일을 검증 후, 고유한 이름으로 S3 버킷에 업로드하고 S3 키를 반환합니다. 최대 10MB 크기의 이미지(JPEG, PNG 등)만 허용합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 업로드할 이미지 파일
 *     responses:
 *       '200':
 *         description: 이미지 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 imageUrl:
 *                   type: string
 *                   description: S3 버킷에 저장된 파일의 키 (URL 아님)
 *                   example: "chat/a1b2c3d4-e5f6-7890-1234-567890abcdef.jpg"
 *                 filename:
 *                   type: string
 *                   description: 원본 파일명
 *                   example: "my-photo.jpg"
 *                 size:
 *                   type: number
 *                   description: 업로드된 파일 크기 (바이트)
 *                   example: 524288
 *                 type:
 *                   type: string
 *                   description: 파일 타입
 *                   example: "image/jpeg"
 *       '400':
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "파일이 없습니다"
 *       '500':
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "이미지 업로드에 실패했습니다"
 */

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get('image') as File;

    if (!file) {
      return HttpResponse.badRequest("파일이 없습니다");
    }

    // 파일 검증
    if (!file.type.startsWith('image/')) {
      return HttpResponse.badRequest("이미지 파일만 업로드 가능합니다");
    }

    // 파일 크기 검증 (10MB 제한)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return HttpResponse.badRequest("파일 크기는 10MB 이하여야 합니다");
    }

    // 파일명 생성
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `chat/${uuidv4()}.${fileExtension}`;

    // S3에 파일 업로드
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ContentLength: file.size,
    });

    await s3Client.send(command);

    // S3 키 반환 (나중에 presigned URL로 변환 가능)
    const imageUrl = fileName;

    return NextResponse.json({
      success: true,
      imageUrl, // S3 키
      filename: file.name,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    return HttpResponse.internalError("이미지 업로드에 실패했습니다");
  }
}