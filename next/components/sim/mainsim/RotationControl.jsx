import React from "react";

// [09.09] 가구 90도 단위 회전 컴포넌트
export function RotationControl({ 
  axis, 
  value, 
  onChange, 
  onQuickRotate,
  onChangeEnd,
  modelName 
}) {
  const axisIndex = ["X", "Y", "Z"].indexOf(axis);
  
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-600 flex-1">
          {`${axis}축 회전`}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onQuickRotate(axisIndex, -90)}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border transition-colors"
            title={`${axis}축 -90° 회전`}
          >
            -90°
          </button>
          <button
            onClick={() => onQuickRotate(axisIndex, 90)}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border transition-colors"
            title={`${axis}축 +90° 회전`}
          >
            +90°
          </button>
        </div>
      </div>
      <ControlSlider
        label=""
        value={value}
        unit="°"
        min={-180}
        max={180}
        step={5}
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        defaultValue={0}
      />
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
  onChangeStart,
  onChangeEnd,
}) {
  const [displayValue, setDisplayValue] = React.useState("");
  const [initialValue, setInitialValue] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const formatValue = (value) => {
    if (step < 1) {
      return Number.isInteger(value) ? String(value) : value.toFixed(1);
    }
    return String(Math.round(value));
  };

  React.useEffect(() => {
    if (value === undefined || value === null)
      setDisplayValue("");
    else
      setDisplayValue(formatValue(value));
  }, [value, step]);

  return (
    <div className="mb-3">
      {/* 라벨과 값 표시 */}
      {label && (
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
      )}

      {/* 값 표시 (라벨이 없을 때만) */}
      {!label && (
        <div className="flex justify-end mb-2">
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
      )}

      {/* 슬라이더 */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onMouseDown={(e) => {
          setIsDragging(true);
          setInitialValue(value);
          if (onChangeStart) onChangeStart(value);
        }}
        onMouseUp={(e) => {
          if (isDragging) {
            setIsDragging(false);
            if (onChangeEnd) onChangeEnd(initialValue, parseFloat(e.target.value));
          }
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          setInitialValue(value);
          if (onChangeStart) onChangeStart(value);
        }}
        onTouchEnd={(e) => {
          if (isDragging) {
            setIsDragging(false);
            if (onChangeEnd) onChangeEnd(initialValue, value);
          }
        }}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );
}