import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 });
    }

    // 파일 검증
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '이미지 파일만 업로드 가능합니다' }, { status: 400 });
    }

    // 파일 크기 검증 (10MB 제한)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다' }, { status: 400 });
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
    return NextResponse.json(
      { error: '이미지 업로드에 실패했습니다' },
      { status: 500 }
    );
  }
}