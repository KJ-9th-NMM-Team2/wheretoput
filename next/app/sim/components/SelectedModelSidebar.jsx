import React from "react";
import { useState, useEffect } from "react";
import { useStore } from "../store/useStore.js";

export function SelectedModelEditModal() {
  const {
    loadedModels,
    selectedModelId,
    removeModel,
    updateModelPosition,
    updateModelRotation,
    updateModelScale,
    deselectModel,
  } = useStore();

  // 선택된 모델 찾기
  const selectedModel = loadedModels.find(model => model.id === selectedModelId);

  // 선택된 모델이 없으면 모달을 표시하지 않음
  if (!selectedModel) {
    return null;
  }

  return (
    <div className="fixed top-1/2 right-4 w-80 max-h-[80vh] -translate-y-1/2 z-[200]">
      <div className="bg-white text-black flex flex-col border border-gray-200 shadow-2xl rounded-xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <span className="text-base font-bold"> 가구 편집</span>
          <button
            onClick={deselectModel}
            className="text-gray-500 hover:text-gray-700 transition-colors text-lg"
            title="닫기"
          >
            ×
          </button>
        </div>

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-4">

        {/* 가구이름 표시 */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
          <div className="font-bold mb-3 text-sm flex items-center gap-2  break-words">
             {selectedModel.name}
          </div>

          {/* 크기 조정 */}
          <div className="mb-4 font-bold ">
            <ControlSlider
              label={` ${Math.ceil(
                selectedModel.length[0] *
                  (Array.isArray(selectedModel.scale) ? selectedModel.scale[0] : selectedModel.scale)
              )}mm × ${Math.ceil(
                selectedModel.length[1] *
                  (Array.isArray(selectedModel.scale) ? selectedModel.scale[1] : selectedModel.scale)
              )}mm × ${Math.ceil(
                selectedModel.length[2] *
                  (Array.isArray(selectedModel.scale) ? selectedModel.scale[2] : selectedModel.scale)
              )}mm`}
              value={Array.isArray(selectedModel.scale) ? selectedModel.scale[0] : selectedModel.scale}
              unit="x"
              min={0.1}
              max={5}
              step={0.1}
              onChange={(value) => updateModelScale(selectedModel.id, value)}
              defaultValue={1}
            />
          </div>

          {/* 높이 조정 */}
          <div className="mb-4 font-bold">
            <ControlSlider
              label="바닥으로부터의 높이"
              value={selectedModel.position[1]}
              unit="m"
              min={0}
              max={5}
              step={0.1}
              onChange={(value) => {
                const newPosition = [...selectedModel.position];
                newPosition[1] = value;
                updateModelPosition(selectedModel.id, newPosition);
              }}
              defaultValue={0}
            />
          </div>

          {/* 회전 조정 */}
          <div className="mb-4 font-bold">
            <div className="text-md mb-2 text-gray-600 font-semibold">
               회전 각도
            </div>
            {["X", "Y", "Z"].map((axis, index) => (
              <div key={axis} className="mb-3">
                <ControlSlider
                  label={`${axis}축 회전`}
                  value={(selectedModel.rotation[index] * 180) / Math.PI}
                  unit="°"
                  min={-180}
                  max={180}
                  step={5}
                  onChange={(value) => {
                    const newRotation = [...selectedModel.rotation];
                    newRotation[index] = (value * Math.PI) / 180;
                    updateModelRotation(selectedModel.id, newRotation);
                  }}
                  defaultValue={0}
                />
              </div>
            ))}
          </div>

          {/* 제거 버튼 */}
          <button
            onClick={() => removeModel(selectedModel.id)}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            🗑️ 가구 삭제
          </button>
        </div>
        </div>
      </div>
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
  defaultValue = 0,
}) {
  const [displayValue, setDisplayValue] = useState("");

  const formatValue = (value) => {
    if (step < 1) {
      return Number.isInteger(value) ? String(value) : value.toFixed(1);
    }
    return String(Math.round(value));
  };

  useEffect(() => {
    if (value === undefined || value === null)
      setDisplayValue("");
    else
      setDisplayValue(formatValue(value));
  }, [value, step]);

  return (
    <div className="mb-3">
      {/* 라벨과 값 표시 */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-600">
          {label}
        </span>
        <div className="flex items-center border border-gray-300 rounded px-2 py-1 bg-gray-50">
          <input
            type="number"
            value={displayValue}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const val = e.target.value;
              setDisplayValue(val);

              if (val === "" || val === "-" || val === ".")
                return;
              onChange(parseFloat(val));
            }}
            onBlur={() => {
              if (displayValue === "" || displayValue === "-" || displayValue === ".") {
                const fallback = formatValue(defaultValue);
                setDisplayValue(fallback);
                onChange(parseFloat(fallback));
              }
            }}
            className="w-12 text-xs text-right bg-transparent border-none outline-none text-gray-700"
          />
          <span className="text-xs text-gray-500 ml-1">
            {unit}
          </span>
        </div>
      </div>

      {/* 슬라이더 */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );
}