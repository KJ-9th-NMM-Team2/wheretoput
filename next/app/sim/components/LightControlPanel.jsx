import React from 'react'
import { useStore } from '../store/useStore.js'

export function LightControlPanel() {
  const {
    ambientLightIntensity,
    directionalLightAzimuth,
    directionalLightElevation,
    directionalLightIntensity,
    setAmbientLightIntensity,
    setDirectionalLightAzimuth,
    setDirectionalLightElevation,
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
      width: '250px',
      maxHeight: '400px',
      overflowY: 'auto'
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>☀️ 빛 세팅</h3>

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
          <ControlSlider
            label="주변광 세기"
            value={ambientLightIntensity}
            min={0}
            max={1}
            step={0.01}
            onChange={setAmbientLightIntensity}
            displayValue={`${ambientLightIntensity}`}
            compact
          />
          <ControlSlider
            label="방위각"
            value={directionalLightAzimuth}
            min={0}
            max={360}
            step={1}
            onChange={setDirectionalLightAzimuth}
            displayValue={`${directionalLightAzimuth}°`}
            compact
          />
          <ControlSlider
            label="고도"
            value={directionalLightElevation}
            min={0}
            max={90}
            step={1}
            onChange={setDirectionalLightElevation}
            displayValue={`${directionalLightElevation}°`}
            compact
          />
          <ControlSlider
            label="햇빛 세기"
            value={directionalLightIntensity}
            min={0}
            max={1}
            step={0.01}
            onChange={setDirectionalLightIntensity}
            displayValue={`${directionalLightIntensity}`}
            compact
          />
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
        minWidth: '50px',
        fontSize: '10px',
        whiteSpace: 'nowrap'
      }}>
        {label}
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
        color: '#ffffffff',
        minWidth: '20px',
        fontSize: '10px',
        textAlign: 'right'
      }}>
        {displayValue}
      </span>
    </div>
  )
}