import React from "react";
import { useStore } from "@/components/sim/useStore";

export function InfoPanel({ isPopup = false }) {
  const {
    loadedModels,
    selectedModelId,
    selectModel,
    removeModel,
    updateModelPosition,
    updateModelRotation,
    updateModelScale,
  } = useStore();

  if (loadedModels.length === 0) {
    return null;
  }

  const baseStyle = {
    background: "rgba(0,0,0,0.7)",
    padding: "15px",
    borderRadius: "5px",
    color: "white",
    fontSize: "12px",
    width: "300px",
    maxHeight: "400px",
    overflowY: "auto",
  };

  const positionStyle = isPopup ? 
    { position: "static" } : 
    { position: "absolute", bottom: "10px", right: "10px", zIndex: 100 };

  return (
    <div
      style={{
        ...baseStyle,
        ...positionStyle
      }}
    >
      <h3 style={{ margin: "0 0 10px 0" }}>
        📦 로드된 모델들 ({loadedModels.length}개)
      </h3>

      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {loadedModels.map((model) => (
          <ModelItem
            key={model.id}
            model={model}
            isSelected={selectedModelId === model.id}
            onSelect={selectModel}
            onRemove={removeModel}
            onPositionChange={updateModelPosition}
            onRotationChange={updateModelRotation}
            onScaleChange={updateModelScale}
          />
        ))}
      </div>
    </div>
  );
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
        background: isSelected ? "rgba(0,255,0,0.2)" : "rgba(255,255,255,0.1)",
        margin: "5px 0",
        padding: "8px",
        borderRadius: "3px",
        border: isSelected
          ? "2px solid #00ff00"
          : "1px solid rgba(255,255,255,0.2)",
        cursor: "pointer",
      }}
      onClick={() => onSelect(model.id)}
    >
      {/* 모델 이름 */}
      <div
        style={{
          marginBottom: "5px",
          wordBreak: "break-all",
          fontWeight: isSelected ? "bold" : "normal",
        }}
      >
        {isSelected ? "🎯 " : ""}
        {model.name.length > 25
          ? model.name.substring(0, 25) + "..."
          : model.name}
      </div>

      {isSelected && (
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {/* 크기 조정 */}
          <ControlSlider
            label={`크기 ${Math.ceil(
              model.length[0] *
                (Array.isArray(model.scale) ? model.scale[0] : model.scale)
            )}mm x ${Math.ceil(
              model.length[1] *
                (Array.isArray(model.scale) ? model.scale[1] : model.scale)
            )}mm x ${Math.ceil(
              model.length[2] *
                (Array.isArray(model.scale) ? model.scale[2] : model.scale)
            )}mm`}
            value={Array.isArray(model.scale) ? model.scale[0] : model.scale}
            unit="x"
            min={0.1}
            max={5}
            step={0.1}
            onChange={(value) => onScaleChange(model.id, value)}
            compact={true}
          />

          {/* 위치 조정 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <ControlSlider
              key={"Y"}
              label={"바닥으로부터의 높이"}
              value={model.position[1]}
              unit="m"
              min={0}
              max={5}
              step={0.1}
              onChange={(value) => {
                const newPosition = [...model.position];
                newPosition[1] = value;
                onPositionChange(model.id, newPosition);
              }}
              compact={true}
            />
          </div>

          {/* 회전 조정 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {["X", "Y", "Z"].map((axis, index) => (
              <ControlSlider
                key={axis}
                label={`각도 ${axis}`}
                value={(model.rotation[index] * 180) / Math.PI}
                unit="°"
                min={-180}
                max={180}
                step={5}
                onChange={(value) => {
                  const newRotation = [...model.rotation];
                  newRotation[index] = (value * Math.PI) / 180;
                  onRotationChange(model.id, newRotation);
                }}
                compact={true}
              />
            ))}
          </div>

          {/* 제거 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(model.id);
            }}
            style={{
              background: "#f44336",
              color: "white",
              border: "none",
              padding: "4px 8px",
              borderRadius: "2px",
              cursor: "pointer",
              fontSize: "10px",
              marginTop: "3px",
            }}
          >
            🗑️ 제거
          </button>
        </div>
      )}
    </div>
  );
}

function ControlSlider({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
  compact = false,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: compact ? "3px" : "5px",
      }}
    >
      {/* 슬라이더 첫번째 줄 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "5px",
        }}
      >
        <span
          style={{
            minWidth: compact ? "12px" : "30px",
            fontSize: "10px",
          }}
        >
          {label}
        </span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "0 2px",
            background: "#fff",
          }}
        >
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            style={{
              width: compact ? "40px" : "60px",
              color: "#000000ff",
              fontSize: "10px",
              padding: "2px",
              textAlign: "right",
            }}
          />
          <span style={{ fontSize: "10px", color: "#000000ff" }}>{unit}</span>
        </div>
      </div>

      {/* 슬라이더 두번째 줄 */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}
