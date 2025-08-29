import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convertImageToGLB } from '../../sonnet4_api.js'
import path from 'path'
import fs from 'fs/promises'
import https from 'https'
import { createWriteStream } from 'fs'

// URL에서 이미지를 다운로드하는 함수
async function downloadImage(imageUrl, localPath) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(localPath)
    
    https.get(imageUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
        return
      }
      
      response.pipe(file)
      
      file.on('finish', () => {
        file.close()
        resolve(localPath)
      })
      
      file.on('error', (err) => {
        fs.unlink(localPath).catch(() => {}) // 실패한 파일 삭제
        reject(err)
      })
    }).on('error', (err) => {
      reject(err)
    })
  })
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

    // 이미 model_url이 있는 경우 기존 파일 사용
    if (furniture.model_url) {
      console.log('기존 model_url 발견:', furniture.model_url)
      
      // 파일이 실제로 존재하는지 확인
      const modelPath = path.join(process.cwd(), 'public', furniture.model_url)
      try {
        await fs.access(modelPath)
        console.log('기존 3D 모델 파일 존재 확인:', furniture.model_url)
        return NextResponse.json({
          success: true,
          furniture_id: furniture_id,
          model_url: furniture.model_url,
          message: '기존 3D 모델을 사용합니다.'
        })
      } catch (error) {
        console.log('기존 파일이 없음. 다른 확장자도 확인...')
        
        // GLB/GLTF 양쪽 확장자로 확인
        const modelDir = path.dirname(modelPath)
        const baseName = path.basename(modelPath, path.extname(modelPath))
        const altExtension = furniture.model_url.endsWith('.glb') ? '.gltf' : '.glb'
        const altModelPath = path.join(modelDir, baseName + altExtension)
        const altModelUrl = furniture.model_url.replace(path.extname(furniture.model_url), altExtension)
        
        try {
          await fs.access(altModelPath)
          console.log('대체 확장자 파일 발견:', altModelUrl)
          
          // DB에서 model_url을 올바른 확장자로 업데이트
          await prisma.furnitures.update({
            where: { furniture_id: furniture_id },
            data: { model_url: altModelUrl }
          })
          
          return NextResponse.json({
            success: true,
            furniture_id: furniture_id,
            model_url: altModelUrl,
            message: '기존 3D 모델을 사용합니다 (확장자 수정됨).'
          })
        } catch (altError) {
          console.log('대체 확장자 파일도 없음. 새로 생성합니다.')
        }
      }
    }

    if (!furniture.image_url) {
      return NextResponse.json(
        { error: '이미지 URL이 없습니다.' },
        { status: 400 }
      )
    }

    console.log('가구 정보:', furniture.name, furniture.image_url)

    // 2. 이미지 URL에서 로컬로 다운로드
    const timestamp = Date.now()
    const imageExtension = path.extname(new URL(furniture.image_url).pathname) || '.png'
    const localImageName = `temp_${furniture_id}_${timestamp}${imageExtension}`
    const localImagePath = path.join(process.cwd(), 'temp', localImageName)
    
    // temp 폴더가 없으면 생성
    const tempDir = path.join(process.cwd(), 'temp')
    try {
      await fs.access(tempDir)
    } catch {
      await fs.mkdir(tempDir, { recursive: true })
    }

    console.log('이미지 다운로드 중...', furniture.image_url)
    await downloadImage(furniture.image_url, localImagePath)
    console.log('이미지 다운로드 완료:', localImageName)

    // 3. model_url 폴더 생성 (없으면)
    const modelDir = path.join(process.cwd(), 'public', 'model_url')
    try {
      await fs.access(modelDir)
    } catch {
      await fs.mkdir(modelDir, { recursive: true })
      console.log('model_url 폴더 생성됨')
    }

    // 4. 깔끔한 3D 모델 파일명 생성 (확장자는 나중에 결정)
    const cleanName = furniture.name.replace(/[^a-zA-Z0-9가-힣]/g, '').substring(0, 20) // 특수문자 제거, 20자 제한
    const modelBaseName = `${cleanName}_${furniture_id.substring(0, 8)}` // furniture_id 앞 8자리만 사용
    const tempModelPath = path.join(modelDir, `${modelBaseName}.temp`) // 임시 경로
    
    // 5. sonnet4_api를 사용해 3D 모델로 변환
    console.log('이미지를 3D 모델로 변환 중...')
    const result = await convertImageToGLB(
      localImagePath,
      tempModelPath,
      [0, 0, 0], // position
      1 // scale
    )
    
    // 6. 실제 생성된 파일의 확장자를 확인하고 적절한 파일명으로 변경
    let finalModelPath
    let finalFilename
    let modelUrl
    
    if (result.filename) {
      const resultPath = result.filename
      const resultExt = path.extname(resultPath)
      
      // 실제 생성된 확장자를 사용
      if (resultExt === '.gltf') {
        finalFilename = `${modelBaseName}.gltf`
        finalModelPath = path.join(modelDir, finalFilename)
        modelUrl = `/model_url/${finalFilename}`
        console.log(`GLTF 파일 생성됨: ${finalFilename}`)
      } else if (resultExt === '.glb') {
        finalFilename = `${modelBaseName}.glb`
        finalModelPath = path.join(modelDir, finalFilename)
        modelUrl = `/model_url/${finalFilename}`
        console.log(`GLB 파일 생성됨: ${finalFilename}`)
      } else {
        // 기본값은 GLB로 설정
        finalFilename = `${modelBaseName}.glb`
        finalModelPath = path.join(modelDir, finalFilename)
        modelUrl = `/model_url/${finalFilename}`
        console.log(`기본 GLB 확장자 사용: ${finalFilename}`)
      }
      
      // 파일을 model_url 폴더로 이동 (필요한 경우만)
      if (resultPath !== finalModelPath) {
        await fs.rename(resultPath, finalModelPath)
        console.log(`파일 이동: ${path.basename(resultPath)} → ${finalFilename}`)
      }
    } else {
      // result.filename이 없는 경우 기본값
      finalFilename = `${modelBaseName}.glb`
      finalModelPath = path.join(modelDir, finalFilename)
      modelUrl = `/model_url/${finalFilename}`
    }
    
    console.log('3D 변환 성공:', finalFilename)

    // 7. DB의 model_url 컬럼 업데이트
    const updatedFurniture = await prisma.furnitures.update({
      where: { furniture_id: furniture_id },
      data: { model_url: modelUrl }
    })

    // 6. 임시 파일 정리
    try {
      await fs.unlink(localImagePath)
      console.log('임시 이미지 파일 삭제 완료')
    } catch (err) {
      console.warn('임시 파일 삭제 실패:', err.message)
    }

    console.log('DB 업데이트 완료:', updatedFurniture.model_url)

    return NextResponse.json({
      success: true,
      furniture_id: furniture_id,
      model_url: modelUrl,
      filename: finalFilename,
      message: '3D 모델 생성 및 DB 업데이트 완료'
    })

  } catch (error) {
    console.error('3D 모델 생성 오류:', error)
    return NextResponse.json(
      { error: '3D 모델 생성에 실패했습니다: ' + error.message },
      { status: 500 }
    )
  }
}