import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function POST(request) {
  try {
    console.log('3D 모델 업로드 API 호출됨')
    
    const formData = await request.formData()
    const modelFile = formData.get('model')
    
    if (!modelFile) {
      console.log('모델 파일이 없음')
      return NextResponse.json(
        { error: '모델 파일이 없습니다.' },
        { status: 400 }
      )
    }

    console.log('모델 파일 정보:', modelFile.name, modelFile.size)

    // 파일 확장자 검증
    const fileName = modelFile.name.toLowerCase()
    if (!fileName.endsWith('.glb') && !fileName.endsWith('.gltf')) {
      return NextResponse.json(
        { error: 'GLB 또는 GLTF 파일만 업로드 가능합니다.' },
        { status: 400 }
      )
    }

    // 업로드된 모델을 public/asset에 저장
    const timestamp = Date.now()
    const fileExtension = path.extname(modelFile.name)
    const modelName = `${path.basename(modelFile.name, fileExtension)}_${timestamp}${fileExtension}`
    const modelPath = path.join(process.cwd(), 'public', 'asset', modelName)
    
    const modelBuffer = await modelFile.arrayBuffer()
    await fs.writeFile(modelPath, Buffer.from(modelBuffer))
    console.log('모델 저장 완료:', modelName)

    return NextResponse.json({
      success: true,
      modelPath: `/asset/${modelName}`,
      filename: modelName,
      type: fileExtension === '.glb' ? 'glb' : 'gltf'
    })

  } catch (error) {
    console.error('모델 업로드 오류:', error)
    return NextResponse.json(
      { error: '모델 업로드에 실패했습니다: ' + error.message },
      { status: 500 }
    )
  }
}