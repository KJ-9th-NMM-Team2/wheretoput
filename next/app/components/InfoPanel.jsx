import React from 'react'
import { useStore } from '../store/useStore.js'
export function InfoPanel() {
  const {
    loadedModels,
    selectedModelId,
    selectModel,
    removeModel,
    updateModelPosition,
    updateModelRotation,
    updateModelScale
  } = useStore()

  if (loadedModels.length === 0) {
    return null
  }
  return (
    <div style={{
      position: 'absolute',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.7)',
      padding: '15px',
      borderRadius: '5px',
      zIndex: 100,
      color: 'white',
      fontSize: '12px',
      width: '350px',
      maxHeight: '400px',
      overflowY: 'auto'
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>📦 로드된 모델들 ({loadedModels.length}개)</h3>

      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {loadedModels.map(model => (
          <ModelItem
            key={model.id}
            model={model}
            isSelected={selectedModelId === model.id}
            onSelect={selectModel}
            onRemove={removeModel}
            onPositionChange={updateModelPosition}
            onRotationChange={updateModelRotation}
            onScaleChange={updateModelScale}
            furnitures={result.furnitures}
          />
        ))}
      </div>
    </div>
  )
}

function ModelItem({
  model,
  isSelected,
  onSelect,
  onRemove,
  onPositionChange,
  onRotationChange,
  onScaleChange,
}) {
  return (
    <div
      key={model.id}
      style={{
        background: isSelected ? 'rgba(0,255,0,0.2)' : 'rgba(255,255,255,0.1)',
        margin: '5px 0',
        padding: '8px',
        borderRadius: '3px',
        border: isSelected ? '2px solid #00ff00' : '1px solid rgba(255,255,255,0.2)',
        cursor: 'pointer'
      }}
      onClick={() => onSelect(model.id)}
    >
      {/* 모델 이름 */}
      <div style={{
        marginBottom: '5px',
        wordBreak: 'break-all',
        fontWeight: isSelected ? 'bold' : 'normal'
      }}>
        {isSelected ? '🎯 ' : ''}{model.name.length > 25 ? model.name.substring(0, 25) + '...' : model.name}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {/* 크기 조정 */}
        <ControlSlider
          label="크기"
          value={model.scale}
          min={0.0005} // 1m = 0.05mm (2000:1 축소)
          max={0.005} // 1m = 5mm (200:1 축소, 기준값)
          step={0.0005} 
          onChange={(value) => onScaleChange(model.id, value)}
          displayValue={`1m :${(model.scale * 1000).toFixed(2)}mm`} // model.scale.toFixed(1) + 'x'
        />

        {/* 위치 조정 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {['X', 'Y', 'Z'].map((axis, index) => (
            <ControlSlider
              key={axis}
              label={axis}
              value={model.position[index]}
              min={axis === 'Y' ? 0 : -15}
              max={axis === 'Y' ? 5 : 15}
              step={0.1}
              onChange={(value) => {
                const newPosition = [...model.position]
                newPosition[index] = value
                onPositionChange(model.id, newPosition)
              }}
              displayValue={model.position[index].toFixed(1)}
              compact={true}
            />
          ))}
        </div>

        {/* 회전 조정 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {['RX', 'RY', 'RZ'].map((axis, index) => (
            <ControlSlider
              key={axis}
              label={axis}
              value={(model.rotation[index] * 180 / Math.PI)}
              min={-180}
              max={180}
              step={5}
              onChange={(value) => {
                const newRotation = [...model.rotation]
                newRotation[index] = value * Math.PI / 180
                onRotationChange(model.id, newRotation)
              }}
              displayValue={(model.rotation[index] * 180 / Math.PI).toFixed(0) + '°'}
              compact={true}
            />
          ))}
        </div>

        {/* 제거 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(model.id)
          }}
          style={{
            background: '#f44336',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '2px',
            cursor: 'pointer',
            fontSize: '10px',
            marginTop: '3px'
          }}
        >
          🗑️ 제거
        </button>
      </div>
    </div>
  )
}

function ControlSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayValue,
  compact = false
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: compact ? '3px' : '5px'
    }}>
      <span style={{
        minWidth: compact ? '12px' : '30px',
        fontSize: '10px'
      }}>
        {label}:
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1 }}
      />
      <span style={{
        color: '#4CAF50',
        minWidth: '30px',
        fontSize: '10px',
        textAlign: 'right'
      }}>
        {displayValue}
      </span>
    </div>
  )
}