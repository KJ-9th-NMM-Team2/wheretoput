import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const s3Key = searchParams.get('s3Key');

    if (!s3Key) {
      return NextResponse.json({ error: 'S3 키가 필요합니다' }, { status: 400 });
    }

    // S3에서 이미지 가져오기
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: s3Key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      return NextResponse.json({ error: '이미지를 찾을 수 없습니다' }, { status: 404 });
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
    return NextResponse.json(
      { error: '이미지 다운로드에 실패했습니다' },
      { status: 500 }
    );
  }
}