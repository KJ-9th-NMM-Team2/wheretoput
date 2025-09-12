import React from "react";

// [09.09] 가구 90도 단위 회전 컴포넌트
// [09.11] 45 회전으로 변경 및 디자인 업데이트
export function RotationControl({
  axis,
  value,
  onChange,
  onQuickRotate,
  onChangeEnd,
}) {
  const [displayValue, setDisplayValue] = React.useState("");
  const [initialValue, setInitialValue] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const axisIndex = ["X", "Y", "Z"].indexOf(axis);

  const formatValue = (value) => {
    return String(Math.round(value));
  };

  React.useEffect(() => {
    if (value === undefined || value === null)
      setDisplayValue("");
    else
      setDisplayValue(formatValue(value));
  }, [value]);

  return (
    <div className="mb-3">
      {/* 라벨과 값 표시 */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-600">
          {`${axis}축 회전`}
        </span>
        <div className="flex gap-1">
          <div className="flex gap-1">
            <button
              onClick={() => onQuickRotate(axisIndex, -45)}
              className="px-2 cursor-pointer py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
              title={`${axis}축 -45° 회전`}
            >
              -45°
            </button>
            <button
              onClick={() => onQuickRotate(axisIndex, 45)}
              className="px-2 cursor-pointer py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
              title={`${axis}축 +45° 회전`}
            >
              +45°
            </button>
          </div>
          <div className="flex items-center border border-gray-300 rounded px-2 py-1 bg-gray-50">
            <input
              type="number"
              value={displayValue}
              min={0}
              max={360}
              step={5}
              onChange={(e) => {
                const val = e.target.value;
                setDisplayValue(val);

                if (val === "" || val === "-" || val === ".")
                  return;

                onChange(val);
              }}
              onBlur={() => {
                if (displayValue === "" || displayValue === "-" || displayValue === ".") {
                  setDisplayValue(0);
                  onChange(0);
                }
              }}
              className="w-12 text-xs text-right bg-transparent border-none outline-none text-gray-700"
            />
            <span className="text-xs text-gray-500 ml-1">°</span>
          </div>
        </div>
      </div>

      {/* 슬라이더 */}
      <input
        type="range"
        min={0}
        max={360}
        step={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onMouseDown={() => {
          setIsDragging(true);
          setInitialValue(value);
        }}
        onMouseUp={(e) => {
          if (isDragging) {
            setIsDragging(false);
            if (onChangeEnd) onChangeEnd(initialValue, e.target.value);
          }
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          setInitialValue(value);
        }}
        onTouchEnd={(e) => {
          if (isDragging) {
            setIsDragging(false);
            if (onChangeEnd) onChangeEnd(initialValue, e.target.value);
          }
        }}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );
}