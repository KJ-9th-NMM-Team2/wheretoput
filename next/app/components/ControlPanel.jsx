import React, { useRef } from 'react'
import { useStore } from '../store/useStore.js'
import { useWallDetection } from '../hooks/useWallDetection.js'

export function ControlPanel() {
  const floorPlanInputRef = useRef()
  const fileInputRef = useRef()
  
  const { 
    detectedWalls, 
    wallDetectionParams, 
    scaleValue,
    setDetectedWalls,
    setWallDetectionParams,
    setScaleValue,
    addModel,
    clearAllModels,
    convertWallsTo3D
  } = useStore()
  
  const { detectWalls, isOpenCVReady, isLoading } = useWallDetection()

  // 평면도 업로드 처리
  const handleFloorPlanUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일을 선택해주세요.')
      return
    }
    
    try {
      const result = await detectWalls(file, wallDetectionParams)
      const walls3D = convertWallsTo3D(result.lines, result.imageWidth, result.imageHeight)
      setDetectedWalls(walls3D)
      console.log('검출된 벽 선분:', result.lines.length, '-> 3D 벽:', walls3D.length)
    } catch (error) {
      console.error('벽 검출 실패:', error)
      alert('벽 검출에 실패했습니다: ' + error.message)
    }
    
    event.target.value = ''
  }

  // GLB 파일 업로드 처리
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files)
    
    files.forEach((file) => {
      if (file.name.toLowerCase().endsWith('.glb')) {
        const url = URL.createObjectURL(file)
        
        const isCityKit = file.webkitRelativePath?.includes('city-kit-commercial') || 
                         file.name.includes('building') || 
                         file.name.includes('detail-')
        
        const newModel = {
          url: url,
          name: file.name,
          isCityKit: isCityKit,
          texturePath: isCityKit ? './glb_asset/city-kit-commercial/Models/Textures/variation-b.png' : null
        }
        
        addModel(newModel)
      } else {
        alert(`${file.name}은(는) GLB 파일이 아닙니다.`)
      }
    })
    
    event.target.value = ''
  }

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.7)',
      padding: '15px',
      borderRadius: '5px',
      zIndex: 100,
      color: 'white',
      fontSize: '12px',
      width: '250px',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      {/* 평면도 업로드 섹션 */}
      <div style={{ marginBottom: '10px' }}>
        <label>평면도 업로드 (PNG/JPG):</label>
        <input
          ref={floorPlanInputRef}
          type="file"
          accept="image/*"
          onChange={handleFloorPlanUpload}
          disabled={!isOpenCVReady}
          style={{
            color: 'white',
            background: isOpenCVReady ? '#333' : '#666',
            border: '1px solid #555',
            padding: '5px',
            borderRadius: '3px',
            width: '100%',
            marginTop: '5px'
          }}
        />
        {isLoading && (
          <div style={{ fontSize: '10px', color: '#ffaa00', marginTop: '5px' }}>
            ⏳ OpenCV 로딩 중...
          </div>
        )}
        {!isLoading && !isOpenCVReady && (
          <div style={{ fontSize: '10px', color: '#ff6666', marginTop: '5px' }}>
            ❌ OpenCV 로드 실패
          </div>
        )}
        {isOpenCVReady && (
          <div style={{ fontSize: '10px', color: '#66ff66', marginTop: '5px' }}>
            ✅ OpenCV 준비 완료
          </div>
        )}
        {detectedWalls.length > 0 && (
          <div style={{ fontSize: '10px', color: '#66ff66', marginTop: '5px' }}>
            {detectedWalls.length}개 벽 생성됨
          </div>
        )}
      </div>

      {/* 벽 검출 파라미터 조정 */}
      {detectedWalls.length > 0 && (
        <div style={{ marginBottom: '10px', borderTop: '1px solid #555', paddingTop: '10px' }}>
          <label>벽 검출 파라미터 조정:</label>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: '5px 0' }}>
            <span style={{ minWidth: '50px', fontSize: '10px' }}>형태학:</span>
            <input
              type="range"
              min="0"
              max="1"
              value={wallDetectionParams.morphType}
              onChange={(e) => setWallDetectionParams({ morphType: parseInt(e.target.value) })}
              style={{ flex: 1 }}
            />
            <span style={{ minWidth: '30px', fontSize: '10px' }}>
              {wallDetectionParams.morphType === 0 ? 'OPEN' : 'CLOSE'}
            </span>
          </div>

          {['canny1', 'canny2', 'houghTh'].map((param) => (
            <div key={param} style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: '5px 0' }}>
              <span style={{ minWidth: '50px', fontSize: '10px' }}>
                {param === 'canny1' ? 'Canny1:' : param === 'canny2' ? 'Canny2:' : 'Hough:'}
              </span>
              <input
                type="range"
                min={param === 'canny1' ? 10 : param === 'canny2' ? 50 : 20}
                max={param === 'canny1' ? 200 : param === 'canny2' ? 300 : 150}
                value={wallDetectionParams[param]}
                onChange={(e) => setWallDetectionParams({ [param]: parseInt(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={{ minWidth: '30px', fontSize: '10px' }}>
                {wallDetectionParams[param]}
              </span>
            </div>
          ))}

          <button
            onClick={() => floorPlanInputRef.current?.click()}
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px',
              width: '100%',
              marginTop: '5px'
            }}
          >
            파라미터로 다시 검출
          </button>
          
          <button
            onClick={() => setDetectedWalls([])}
            style={{
              background: '#ff6666',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px',
              width: '100%',
              marginTop: '5px'
            }}
          >
            검출된 벽 제거
          </button>
        </div>
      )}

      {/* GLB 파일 업로드 섹션 */}
      <div style={{ marginBottom: '10px' }}>
        <label>GLB 파일 선택:</label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb"
          multiple
          onChange={handleFileUpload}
          style={{
            color: 'white',
            background: '#333',
            border: '1px solid #555',
            padding: '5px',
            borderRadius: '3px',
            width: '100%',
            marginTop: '5px'
          }}
        />
      </div>
      
      {/* 기본 스케일 설정 */}
      <div style={{ marginBottom: '10px' }}>
        <label>새 모델 기본 크기:</label>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={scaleValue}
          onChange={(e) => setScaleValue(parseFloat(e.target.value))}
          style={{ width: '100%', margin: '5px 0' }}
        />
        <div style={{ color: '#4CAF50', textAlign: 'center' }}>
          {scaleValue.toFixed(1)}x
        </div>
      </div>
      
      {/* 전체 모델 제거 버튼 */}
      <button
        onClick={clearAllModels}
        style={{
          background: '#f44336',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '12px',
          width: '100%'
        }}
      >
        모든 모델 제거
      </button>
    </div>
  )
}