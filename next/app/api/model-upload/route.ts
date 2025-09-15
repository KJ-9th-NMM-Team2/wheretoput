import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// Trellis API 사용으로 변경
import { generateTrellisModel } from '@/lib/trellis_api.js';
import cacheUtils, { CACHE_DIR } from "@/lib/cache/CacheUtils";
import path from 'path';
import { HttpResponse } from "@/utils/httpResponse";


/**
 * @swagger
 * /api/model-upload:
 * post:
 * tags:
 * - 3D Model
 * summary: 가구의 3D 모델을 생성하거나 기존 모델을 반환합니다.
 * description: |
 * - **기존 모델**: 요청된 `furniture_id`에 해당하는 가구에 이미 3D 모델 URL이 있는 경우, 해당 모델을 제공합니다. 이 과정에서 로컬 캐시를 확인하고, 없으면 S3에서 다운로드하여 캐시를 생성합니다.
 * - **새 모델 생성**: 3D 모델 URL이 없는 경우, 가구의 이미지 URL을 사용하여 Trellis API로 새로운 3D 모델을 생성하고 S3에 업로드합니다.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - furniture_id
 * properties:
 * furniture_id:
 * type: string
 * description: 3D 모델을 요청할 가구의 고유 ID
 * example: "furniture-12345"
 * responses:
 * '200':
 * description: 3D 모델 생성 또는 제공 성공
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success:
 * type: boolean
 * example: true
 * furniture_id:
 * type: string
 * example: "furniture-12345"
 * model_url:
 * type: string
 * description: 생성되거나 제공된 3D 모델의 URL
 * example: "https://your-s3-bucket.s3.amazonaws.com/models/furniture-12345.glb"
 * message:
 * type: string
 * example: "S3에 3D 모델 업로드 및 DB 업데이트 완료"
 * cached:
 * type: boolean
 * description: 파일이 로컬 캐시에서 제공되었는지 여부
 * example: true
 * '400':
 * description: 잘못된 요청
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * error:
 * type: string
 * example: "furniture_id가 필요합니다."
 * '404':
 * description: 가구를 찾을 수 없음
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * error:
 * type: string
 * example: "가구를 찾을 수 없습니다."
 * '500':
 * description: 서버 내부 오류
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * error:
 * type: string
 * example: "S3에 3D 모델 업로드에 실패했습니다: S3 연결 오류"
 */
export async function POST(request: NextRequest) {
  try {
    // 캐시 디렉토리 생성
    await cacheUtils.ensureCacheDir(CACHE_DIR);

    console.log('3D 모델 생성 API 호출됨')
    
    const { furniture_id } = await request.json();
    
    if (!furniture_id) {
      return HttpResponse.badRequest("furniture_id가 필요합니다.");
    }

    // 1. DB에서 가구 정보 조회
    const furniture = await prisma.furnitures.findUnique({
      where: { furniture_id: furniture_id },
      select: {
        model_url: true,
        image_url: true,
        name: true,
      }
    })

    if (!furniture) {
      return HttpResponse.notFound("가구를 찾을 수 없습니다.");
    }

    // 이미 model_url이 있는 경우 기존 URL 사용 (S3 또는 로컬)
    if (furniture.model_url) {
      console.log('기존 model_url 발견:', furniture.model_url)

      const fileName = `${furniture_id}.glb`;
      const localPath = path.join(CACHE_DIR, fileName);

      // 이미 캐시된 파일이 있는지 확인
      try {
        console.log('캐시된 파일 확인:', localPath);

        const response = await cacheUtils.useLocalFileCache(localPath, fileName, furniture_id);
        
        if (response) {
          return response;
        }
        console.log('캐시된 파일 없음, 다운로드 시작');
      } catch (error) {
        console.log('캐시 확인 중 오류:', error);
      }

      // S3에서 다운로드 및 캐싱
      try {   
        console.log('다운로드 파일 확인:', localPath);
        return await cacheUtils.downloadFileFromS3ToLocal(furniture, localPath, fileName, furniture_id);
      } catch (downloadError) {
        // S3 URL인지 확인
        if (furniture.model_url.startsWith('https://') && furniture.model_url.includes('s3')) {
          console.log('기존 S3 URL 사용:', furniture.model_url)
          return NextResponse.json({
            success: true,
            furniture_id: furniture_id,
            model_url: furniture.model_url,
            message: '기존 S3 3D 모델을 사용합니다.',
            cached: false,
          })
        }
      }
    }

    if (!furniture.image_url) {
      return HttpResponse.badRequest("이미지 URL이 없습니다.");
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
    return HttpResponse.internalError("S3에 3D 모델 업로드에 실패했습니다:", error.message);
  }
}