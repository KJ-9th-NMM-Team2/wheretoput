import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { convertImageToGLB } from '../../sonnet4_api.js'

export async function POST(request) {
  try {
    console.log('가구 임포트 API 호출됨')
    
    const formData = await request.formData()
    const imageFile = formData.get('image')
    
    if (!imageFile) {
      console.log('이미지 파일이 없음')
      return NextResponse.json(
        { error: '이미지 파일이 없습니다.' },
        { status: 400 }
      )
    }

    console.log('이미지 파일 정보:', imageFile.name, imageFile.size)

    // 1. 업로드된 이미지를 public/asset에 저장
    const timestamp = Date.now()
    const fileExtension = path.extname(imageFile.name)
    const imageName = `${path.basename(imageFile.name, fileExtension)}_${timestamp}${fileExtension}`
    const imageUrl = path.join(process.cwd(), 'public', 'asset', imageName)
    
    const imageBuffer = await imageFile.arrayBuffer()
    await fs.writeFile(imageUrl, Buffer.from(imageBuffer))
    console.log('이미지 저장 완료:', imageName)

    // 2. 3D 파일명 생성 (GLB 또는 GLTF)
    const baseName = `${path.basename(imageFile.name, fileExtension)}_${timestamp}`
    const glbPath = path.join(process.cwd(), 'public', 'asset', `${baseName}.glb`)
    
    // 3. sonnet4_api를 사용해 이미지를 3D 파일로 변환
    console.log('이미지를 3D 파일로 변환 중...')
    const result = await convertImageToGLB(
      imageUrl,
      glbPath,
      [0, 0, 0], // position
      1 // scale
    )
    
    // 결과 파일 경로 확인 (GLB 또는 GLTF가 될 수 있음)
    const actualFilename = path.basename(result.filename || result)
    const fileExtension3D = path.extname(actualFilename)
    
    console.log('3D 변환 성공:', actualFilename)
    return NextResponse.json({
      success: true,
      glbPath: `/asset/${actualFilename}`,
      filename: actualFilename,
      type: fileExtension3D === '.glb' ? 'glb' : 'gltf'
    })

  } catch (error) {
    console.error('가구 임포트 오류:', error)
    return NextResponse.json(
      { error: '가구 임포트에 실패했습니다: ' + error.message },
      { status: 500 }
    )
  }
}