import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image')
    
    if (!imageFile) {
      return NextResponse.json(
        { error: '이미지 파일이 없습니다.' },
        { status: 400 }
      )
    }

    // 임시 파일로 저장
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const tempDir = path.join(process.cwd(), 'temp')
    await fs.mkdir(tempDir, { recursive: true })
    
    const tempImagePath = path.join(tempDir, `temp_${Date.now()}_${imageFile.name}`)
    await fs.writeFile(tempImagePath, buffer)

    // sonnet4_api.js의 convertImageToGLB 함수 사용
    const { convertImageToGLB } = require('../../sonnet4_api.js')
    
    const glbFilename = path.join(process.cwd(), 'public/asset', `imported_${Date.now()}.glb`)
    
    const result = await convertImageToGLB(
      tempImagePath,
      glbFilename,
      [0, 0, 0], // 기본 위치
      1,         // 기본 크기
      false      // 로컬 파일
    )

    // 임시 파일 삭제
    await fs.unlink(tempImagePath)

    // GLB 파일의 웹 경로 반환
    const webPath = `/asset/${path.basename(glbFilename)}`
    
    return NextResponse.json({
      success: true,
      glbPath: webPath,
      filename: path.basename(glbFilename)
    })

  } catch (error) {
    console.error('가구 임포트 오류:', error)
    return NextResponse.json(
      { error: '가구 임포트에 실패했습니다: ' + error.message },
      { status: 500 }
    )
  }
}