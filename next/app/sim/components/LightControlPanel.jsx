import React from 'react'
import { useStore } from '../store/useStore.js'

export function LightControlPanel() {
  const {
    directionalLightPosition,
    directionalLightIntensity,
    setAmbientLightIntensity,
    setDirectionalLightPosition,
    setDirectionalLightIntensity
  } = useStore()

  return (
    <div style={{
      position: 'absolute',
      bottom: '10px',
      left: '10px',
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
      <h3 style={{ margin: '0 0 10px 0' }}>☀️ 햇빛 세팅</h3>

      <div 
      style={{
        background: 'rgba(255,255,255,0.1)',
        margin: '5px 0',
        padding: '8px',
        borderRadius: '3px',
        border: '1px solid rgba(255,255,255,0.2)',
        cursor: 'pointer'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        
        {/* 위치 조정 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {['X', 'Y', 'Z'].map((axis, index) => (
            <ControlSlider
              key={axis}
              label={axis}
              value={directionalLightPosition[index]}
              min={axis === 'Y' ? 0 : -15}
              max={15}
              step={0.1}
              onChange={(value) => {
                const newPosition = [...directionalLightPosition]
                newPosition[index] = value
                setDirectionalLightPosition(newPosition)
              }}
              displayValue={directionalLightPosition[index].toFixed(1)}
              compact={true}
            />
          ))}
        </div>
      </div>
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
        color: '#e6a925ff', 
        minWidth: '30px', 
        fontSize: '10px',
        textAlign: 'right'
      }}>
        {displayValue}
      </span>
    </div>
  )
}