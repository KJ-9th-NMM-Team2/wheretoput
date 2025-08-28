import React from 'react'
import { useStore } from '../store/useStore.js'

export function FurnitureEditor() {
  const { 
    loadedModels, 
    selectedModelId, 
    updateModelPosition, 
    updateModelRotation, 
    updateModelScale,
    removeModel,
    deselectModel
  } = useStore()

  // 선택된 모델 가져오기
  const selectedModel = loadedModels.find((model: any) => model.id === selectedModelId)

  if (!selectedModel) {
    return null // 선택된 가구가 없으면 사이드바 숨김
  }

  return (
    <div style={{
      position: 'absolute',
      top: '380px', // ControlPanel 아래에 배치
      right: '10px',
      width: '250px',
      background: 'rgba(0,0,0,0.8)',
      padding: '15px',
      borderRadius: '8px',
      zIndex: 100,
      color: 'white',
      fontSize: '12px',
      maxHeight: '60vh',
      overflowY: 'auto'
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '1px solid #555'
      }}>
        <h4 style={{
          fontSize: '14px',
          margin: '0',
          fontWeight: 'bold',
          color: '#4CAF50'
        }}>
          🎯 선택된 가구
        </h4>
        <button
          onClick={deselectModel}
          style={{
            background: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>

      {/* 가구 이름 */}
      <div style={{ 
        fontSize: '12px', 
        color: '#ccc', 
        marginBottom: '15px',
        padding: '8px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '4px',
        textAlign: 'center'
      }}>
        {selectedModel.name}
      </div>

      {/* 위치 (Position) */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ 
          fontSize: '12px', 
          fontWeight: 'bold', 
          color: '#4CAF50', 
          marginBottom: '8px', 
          display: 'block' 
        }}>
          📍 위치 (Position)
        </label>
        {['X', 'Y', 'Z'].map((axis, index) => {
          const minVal = axis === 'Y' ? 0 : -10;
          const maxVal = axis === 'Y' ? 5 : 10;
          return (
            <div key={axis} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: '#aaa', minWidth: '15px', fontWeight: 'bold' }}>{axis}:</span>
              <input
                type="range"
                min={minVal}
                max={maxVal}
                step="0.1"
                value={selectedModel.position[index]}
                onChange={(e) => {
                  const newPosition = [...selectedModel.position]
                  newPosition[index] = parseFloat(e.target.value)
                  updateModelPosition(selectedModel.id, newPosition)
                }}
                style={{ 
                  flex: 1,
                  accentColor: '#4CAF50'
                }}
              />
              <span style={{ fontSize: '11px', color: '#aaa', minWidth: '35px', textAlign: 'right' }}>
                {selectedModel.position[index].toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>

      {/* 회전 (Rotation) */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ 
          fontSize: '12px', 
          fontWeight: 'bold', 
          color: '#FF9800', 
          marginBottom: '8px', 
          display: 'block' 
        }}>
          🔄 회전 (Rotation)
        </label>
        {['RX', 'RY', 'RZ'].map((axis, index) => (
          <div key={axis} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#aaa', minWidth: '20px', fontWeight: 'bold' }}>{axis}:</span>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={(selectedModel.rotation[index] * 180 / Math.PI).toFixed(0)}
              onChange={(e) => {
                const newRotation = [...selectedModel.rotation]
                newRotation[index] = parseFloat(e.target.value) * Math.PI / 180
                updateModelRotation(selectedModel.id, newRotation)
              }}
              style={{ 
                flex: 1,
                accentColor: '#FF9800'
              }}
            />
            <span style={{ fontSize: '11px', color: '#aaa', minWidth: '35px', textAlign: 'right' }}>
              {(selectedModel.rotation[index] * 180 / Math.PI).toFixed(0)}°
            </span>
          </div>
        ))}
      </div>

      {/* 크기 (Scale) */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ 
          fontSize: '12px', 
          fontWeight: 'bold', 
          color: '#2196F3', 
          marginBottom: '8px', 
          display: 'block' 
        }}>
          📏 크기 (Scale)
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={selectedModel.scale}
            onChange={(e) => {
              updateModelScale(selectedModel.id, parseFloat(e.target.value))
            }}
            style={{ 
              flex: 1,
              accentColor: '#2196F3'
            }}
          />
          <span style={{ fontSize: '11px', color: '#aaa', minWidth: '35px', fontWeight: 'bold' }}>
            {selectedModel.scale.toFixed(1)}x
          </span>
        </div>
        <input
          type="number"
          step="0.1"
          min="0.1"
          max="3"
          value={selectedModel.scale.toFixed(1)}
          onChange={(e) => {
            const newScale = Math.max(0.1, Math.min(3, parseFloat(e.target.value) || 1))
            updateModelScale(selectedModel.id, newScale)
          }}
          style={{
            width: '100%',
            padding: '6px 8px',
            fontSize: '11px',
            border: '1px solid #555',
            borderRadius: '4px',
            background: '#333',
            color: 'white',
            textAlign: 'center'
          }}
        />
      </div>

      {/* 삭제 버튼 */}
      <button
        onClick={() => {
          removeModel(selectedModel.id)
          deselectModel()
        }}
        style={{
          width: '100%',
          padding: '10px',
          background: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.background = '#d32f2f'}
        onMouseLeave={(e) => e.target.style.background = '#f44336'}
      >
        🗑️ 가구 삭제
      </button>
    </div>
  )
}