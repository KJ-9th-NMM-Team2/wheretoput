import React from 'react'
import { useStore } from '../store/useStore.js'

export function LightControlPanel({ isPopup = false }) {
  const {
    environmentPreset,
    directionalLightAzimuth,
    directionalLightElevation,
    directionalLightIntensity,
    setEnvironmentPreset,
    setDirectionalLightAzimuth,
    setDirectionalLightElevation,
    setDirectionalLightIntensity
  } = useStore()

  const baseStyle = {
    background: 'rgba(0,0,0,0.7)',
    padding: '15px',
    borderRadius: '5px',
    color: 'white',
    fontSize: '16px',
    width: '250px',
    maxHeight: '400px',
    overflowY: 'auto'
  };

  const positionStyle = isPopup ? 
    { position: 'static' } : 
    { position: 'absolute', bottom: '10px', left: '10px', zIndex: 100 };

  return (
    <div style={{
      ...baseStyle,
      ...positionStyle
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>☀️ 빛 세팅</h3>

      <div
        style={{
          background: 'rgba(255,255,255,0.1)',
          margin: '5px 0',
          padding: '8px',
          borderRadius: '3px',
          border: '1px solid rgba(255,255,255,0.2)',
          cursor: 'default'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>

          {/* 위치 조정 */}
          <LightPresetDropdown
            value={environmentPreset}
            onChange={setEnvironmentPreset}
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
            max={5}
            step={0.1}
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
        fontSize: '11px',
        textAlign: 'right'
      }}>
        {displayValue}
      </span>
    </div>
  )
}

function LightPresetDropdown({ value, onChange }) {
  const presets = {
    "아파트": "apartment",
    "도시": "city",
    "창고": "warehouse",
    "일출": "dawn",
    "일몰": "sunset",
    "숲": "forest",
    "로비": "lobby",
    "밤": "night",
    "공원": "park",
    "스튜디오": "studio",
  }

  return (
    <div className="mb-3">
      <label className="block text-xs text-white mb-1">
        조명 프리셋
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-gray-50 text-black focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        {Object.entries(presets).map(([label, value]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}