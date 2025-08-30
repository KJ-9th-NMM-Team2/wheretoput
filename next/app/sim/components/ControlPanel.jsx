import React, { useRef, useState } from 'react'
import { useStore } from '../store/useStore.js'

export function ControlPanel() {
  const fileInputRef = useRef()
  const [saveMessage, setSaveMessage] = useState('')
  
  const { 
    scaleValue,
    setScaleValue,
    addModel,
    clearAllModels,
    saveSimulatorState,
    isSaving,
    currentRoomId,
    lastSavedAt,
    loadedModels
  } = useStore()


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

  // 저장 처리
  const handleSave = async () => {
    if (!currentRoomId) {
      setSaveMessage('방 ID가 설정되지 않았습니다.')
      setTimeout(() => setSaveMessage(''), 3000)
      return
    }

    try {
      await saveSimulatorState()
      setSaveMessage(`저장 완료! (${loadedModels.length}개 가구)`)
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      setSaveMessage(`저장 실패: ${error.message}`)
      setTimeout(() => setSaveMessage(''), 5000)
    }
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
      width: '250px'
    }}>

      
      {/* 기본 스케일 설정 */}
      <div style={{ marginBottom: '10px' }}>
        <label>새 가구 기본 크기:</label>
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
      
      {/* 저장 버튼 */}
      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={handleSave}
          disabled={isSaving || !currentRoomId}
          style={{
            background: currentRoomId ? (isSaving ? '#999' : '#4CAF50') : '#666',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '3px',
            cursor: currentRoomId && !isSaving ? 'pointer' : 'not-allowed',
            fontSize: '12px',
            width: '100%',
            marginBottom: '5px'
          }}
        >
          {isSaving ? '저장 중...' : `방 상태 저장 (${loadedModels.length}개)`}
        </button>
        
        {/* 저장 상태 메시지 */}
        {saveMessage && (
          <div style={{ 
            fontSize: '10px', 
            color: saveMessage.includes('실패') ? '#ff4444' : '#4CAF50',
            textAlign: 'center',
            marginBottom: '5px'
          }}>
            {saveMessage}
          </div>
        )}
        
        {/* 마지막 저장 시간 */}
        {lastSavedAt && (
          <div style={{ 
            fontSize: '9px', 
            color: '#aaa',
            textAlign: 'center',
            marginBottom: '5px'
          }}>
            마지막 저장: {lastSavedAt.toLocaleTimeString()}
          </div>
        )}
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
        모든 가구 제거
      </button>
    </div>
  )
}