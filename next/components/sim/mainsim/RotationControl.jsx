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
    if (value === undefined || value === null) setDisplayValue("");
    else setDisplayValue(formatValue(value));
  }, [value]);

  return (
    <div className="mb-3">
      {/* 라벨과 값 표시 */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-600">{`${axis}축 회전`}</span>
        <div className="flex gap-2">
          <button
            onClick={() => onQuickRotate(axisIndex, -45)}
            className="w-8 h-8 flex items-center justify-center bg-white shadow-md hover:shadow-lg hover:shadow-blue-100 border border-gray-200 hover:border-blue-300 rounded-full text-gray-700 hover:text-blue-600 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 active:translate-y-0 active:scale-100 active:shadow-sm group"
            title={`${axis}축 -45° 회전`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300 group-hover:-rotate-12"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => onQuickRotate(axisIndex, 45)}
            className="w-8 h-8 flex items-center justify-center bg-white shadow-md hover:shadow-lg hover:shadow-blue-100 border border-gray-200 hover:border-blue-300 rounded-full text-gray-700 hover:text-blue-600 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 active:translate-y-0 active:scale-100 active:shadow-sm group"
            title={`${axis}축 +45° 회전`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300 group-hover:rotate-12"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
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

              if (val === "" || val === "-" || val === ".") return;

              onChange(val);
            }}
            onBlur={() => {
              if (
                displayValue === "" ||
                displayValue === "-" ||
                displayValue === "."
              ) {
                setDisplayValue(0);
                onChange(0);
              }
            }}
            className="w-12 text-xs text-right bg-transparent border-none outline-none text-gray-700"
          />
          <span className="text-xs text-gray-500 ml-1">°</span>
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
