import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: { s3Key: string } }
) {
  try {
    const s3Key = decodeURIComponent(params.s3Key);
    console.log('요청된 S3 키:', s3Key);

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
    return NextResponse.json(
      { error: '이미지를 불러올 수 없습니다' },
      { status: 500 }
    );
  }
}