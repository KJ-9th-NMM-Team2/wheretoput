import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// Trellis API 사용으로 변경
import { generateTrellisModel } from '../../trellis_api.js'
import path from 'path'
import fs from 'fs/promises'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync } from 'fs'

// S3 클라이언트 설정
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// S3에 파일 업로드 함수
async function uploadToS3(filePath, key, contentType) {
  try {
    const fileContent = readFileSync(filePath);
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
    });
    
    await s3Client.send(command);
    
    // S3 URL 반환
    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('S3 업로드 실패:', error);
    throw error;
  }
}


export async function POST(request) {
  try {
    console.log('3D 모델 생성 API 호출됨')
    
    const { furniture_id } = await request.json()
    
    if (!furniture_id) {
      return NextResponse.json(
        { error: 'furniture_id가 필요합니다.' },
        { status: 400 }
      )
    }

    // 1. DB에서 가구 정보 조회
    const furniture = await prisma.furnitures.findUnique({
      where: { furniture_id: furniture_id }
    })

    if (!furniture) {
      return NextResponse.json(
        { error: '가구를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 model_url이 있는 경우 기존 URL 사용 (S3 또는 로컬)
    if (furniture.model_url) {
      console.log('기존 model_url 발견:', furniture.model_url)
      
      // S3 URL인지 확인
      if (furniture.model_url.startsWith('https://') && furniture.model_url.includes('s3')) {
        console.log('기존 S3 URL 사용:', furniture.model_url)
        return NextResponse.json({
          success: true,
          furniture_id: furniture_id,
          model_url: furniture.model_url,
          message: '기존 S3 3D 모델을 사용합니다.'
        })
      }
      
      // 로컬 파일인 경우 존재 확인 후 S3로 업로드할지 결정
      const modelPath = path.join(process.cwd(), 'public', furniture.model_url)
      try {
        await fs.access(modelPath)
        console.log('기존 로컬 파일 발견. S3로 마이그레이션하지 않고 기존 URL 사용:', furniture.model_url)
        return NextResponse.json({
          success: true,
          furniture_id: furniture_id,
          model_url: furniture.model_url,
          message: '기존 로컬 3D 모델을 사용합니다.'
        })
      } catch (error) {
        console.log('기존 로컬 파일이 없음. 새로 생성합니다.')
      }
    }

    if (!furniture.image_url) {
      return NextResponse.json(
        { error: '이미지 URL이 없습니다.' },
        { status: 400 }
      )
    }

    console.log('가구 정보:', furniture.name, furniture.image_url)

    console.log('가구 이미지 URL 확인됨:', furniture.image_url)

    // 2. Trellis API를 사용해 3D 모델로 변환
    console.log('이미지를 3D 모델로 변환 중...')
    const result = await generateTrellisModel(furniture_id, furniture.image_url)
    
    // 3. Trellis API 결과 처리 (이미 S3 업로드 및 DB 업데이트가 완료됨)
    if (result.success && result.model_url) {
      console.log('Trellis API 3D 변환 및 S3 업로드 완료:', result.model_url)
      const s3Url = result.model_url
      const finalFilename = path.basename(s3Url)
      
      console.log('3D 변환 성공:', finalFilename)


      console.log('S3 업로드 및 DB 업데이트 완료:', s3Url)

      return NextResponse.json({
        success: true,
        furniture_id: furniture_id,
        model_url: s3Url,
        filename: finalFilename,
        message: 'S3에 3D 모델 업로드 및 DB 업데이트 완료'
      })
    } else {
      throw new Error('Trellis API 3D 모델 생성에 실패했습니다.')
    }

  } catch (error) {
    console.error('3D 모델 생성/업로드 오류:', error)
    return NextResponse.json(
      { error: 'S3에 3D 모델 업로드에 실패했습니다: ' + error.message },
      { status: 500 }
    )
  }
}