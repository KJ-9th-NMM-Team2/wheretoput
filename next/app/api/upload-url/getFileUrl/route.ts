import { NextRequest, NextResponse } from 'next/server';
import getFileUrl from '../getFileUrl';
import { HttpResponse } from '@/utils/httpResponse';

export async function POST(request: NextRequest) {
  try {
    const { s3Key } = await request.json();

    if (!s3Key) {
      return HttpResponse.unAuthorized("S3 키가 필요합니다");
    }

    const url = await getFileUrl(s3Key);

    return NextResponse.json({
      success: true,
      url
    });

  } catch (error) {
    console.error('파일 URL 생성 오류:', error);
    return HttpResponse.internalError("파일 URL 생성에 실패했습니다");
  }
}