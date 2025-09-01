import React from "react";
import { useStore } from '../store/useStore.js'


export function CameraControlPanel() {
  const {
    cameraFov,
    cameraZoom,
    cameraMode,
    setCameraFov,
    setCameraZoom,
    setCameraMode,
  } = useStore();

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
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
      <h3 style={{ margin: '0 0 10px 0' }}>📷 카메라 세팅</h3>

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
          <ControlSlider
            label="시야각"
            value={cameraFov}
            min={5}
            max={120}
            step={1}
            onChange={setCameraFov}
            displayValue={cameraFov}
            compact
          />
        </div>

        {/* <button onClick={() => setCameraMode(cameraMode === "perspective" ? "orthographic" : "perspective")}>
          {cameraMode === "perspective" ? "직교" : "투시"} 모드로 변경하기
        </button> */}
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
        color: '#ffffff',
        minWidth: '20px',
        fontSize: '10px',
        textAlign: 'right'
      }}>
        {displayValue}
      </span>
    </div>
  )
}