import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useStore } from "@/components/sim/useStore";
import { useHistory, ActionType } from "@/components/sim/history";
import { useDeleteKey } from "./useDeleteKey";
import { RotationControl } from "./RotationControl";


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
  
  const { addAction } = useHistory();
  
  // 히스토리 기록을 위한 초기값 저장
  const initialValuesRef = useRef({});
  const debounceTimersRef = useRef({});
  
  // 선택된 모델 찾기
  const selectedModel = loadedModels.find(model => model.id === selectedModelId);
  
  // Delete 키 단축키 처리
  useDeleteKey(selectedModel, addAction, removeModel, deselectModel);
  
  // 모델이 선택될 때 초기값 저장
  useEffect(() => {
    if (selectedModel) {
      initialValuesRef.current = {
        scale: Array.isArray(selectedModel.scale) ? selectedModel.scale[0] : selectedModel.scale,
        position: [...selectedModel.position],
        rotation: [...selectedModel.rotation],
      };
    }
  }, [selectedModelId]);
  
  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      Object.values(debounceTimersRef.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);
  
  // 디바운스된 히스토리 기록 함수
  const debouncedAddHistory = useCallback((type, currentValue, initialValue, description) => {
    const timerKey = type;
    
    // 기존 타이머 클리어
    if (debounceTimersRef.current[timerKey]) {
      clearTimeout(debounceTimersRef.current[timerKey]);
    }
    
    // 새 타이머 설정
    debounceTimersRef.current[timerKey] = setTimeout(() => {
      if (selectedModel && JSON.stringify(currentValue) !== JSON.stringify(initialValue)) {
        addAction({
          type,
          data: {
            furnitureId: selectedModel.id,
            [type === ActionType.FURNITURE_SCALE ? 'scale' : 
             type === ActionType.FURNITURE_ROTATE ? 'rotation' : 'position']: 
             type === ActionType.FURNITURE_SCALE ? 
               { x: currentValue, y: currentValue, z: currentValue } :
               type === ActionType.FURNITURE_ROTATE ?
               { x: currentValue[0], y: currentValue[1], z: currentValue[2] } :
               { x: currentValue[0], y: currentValue[1], z: currentValue[2] },
            previousData: {
              [type === ActionType.FURNITURE_SCALE ? 'scale' : 
               type === ActionType.FURNITURE_ROTATE ? 'rotation' : 'position']: 
               type === ActionType.FURNITURE_SCALE ? 
                 { x: initialValue, y: initialValue, z: initialValue } :
                 type === ActionType.FURNITURE_ROTATE ?
                 { x: initialValue[0], y: initialValue[1], z: initialValue[2] } :
                 { x: initialValue[0], y: initialValue[1], z: initialValue[2] }
            }
          },
          description
        });
        
        // 새로운 값을 초기값으로 업데이트
        if (type === ActionType.FURNITURE_SCALE) {
          initialValuesRef.current.scale = currentValue;
        } else if (type === ActionType.FURNITURE_ROTATE) {
          initialValuesRef.current.rotation = [...currentValue];
        } else {
          initialValuesRef.current.position = [...currentValue];
        }
      }
    }, 1000); // 1초 디바운스
  }, [selectedModel, addAction]);
  
  // 즉시 히스토리 기록 함수 (마우스 이벤트 기반)
  const addHistoryImmediate = useCallback((type, initialValue, finalValue, description) => {
    if (selectedModel && JSON.stringify(initialValue) !== JSON.stringify(finalValue)) {
      addAction({
        type,
        data: {
          furnitureId: selectedModel.id,
          [type === ActionType.FURNITURE_SCALE ? 'scale' : 
           type === ActionType.FURNITURE_ROTATE ? 'rotation' : 'position']: 
           type === ActionType.FURNITURE_SCALE ? 
             { x: finalValue, y: finalValue, z: finalValue } :
             type === ActionType.FURNITURE_ROTATE ?
             { x: finalValue[0], y: finalValue[1], z: finalValue[2] } :
             { x: finalValue[0], y: finalValue[1], z: finalValue[2] },
          previousData: {
            [type === ActionType.FURNITURE_SCALE ? 'scale' : 
             type === ActionType.FURNITURE_ROTATE ? 'rotation' : 'position']: 
             type === ActionType.FURNITURE_SCALE ? 
               { x: initialValue, y: initialValue, z: initialValue } :
               type === ActionType.FURNITURE_ROTATE ?
               { x: initialValue[0], y: initialValue[1], z: initialValue[2] } :
               { x: initialValue[0], y: initialValue[1], z: initialValue[2] }
          }
        },
        description
      });
    }
  }, [selectedModel, addAction]);

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
              onChangeEnd={(initialValue, finalValue) => {
                addHistoryImmediate(
                  ActionType.FURNITURE_SCALE,
                  initialValue,
                  finalValue,
                  `가구 "${selectedModel.name || selectedModel.furnitureName || 'Unknown'}"의 크기를 변경했습니다`
                );
              }}
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
              onChangeEnd={(initialValue, finalValue) => {
                const initialPosition = [...selectedModel.position];
                initialPosition[1] = initialValue;
                const finalPosition = [...selectedModel.position];
                finalPosition[1] = finalValue;
                
                addHistoryImmediate(
                  ActionType.FURNITURE_MOVE,
                  initialPosition,
                  finalPosition,
                  `가구 "${selectedModel.name || selectedModel.furnitureName || 'Unknown'}"의 높이를 변경했습니다`
                );
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
              <RotationControl
                key={axis}
                axis={axis}
                value={(selectedModel.rotation[index] * 180) / Math.PI}
                onChange={(value) => {
                  const newRotation = [...selectedModel.rotation];
                  newRotation[index] = (value * Math.PI) / 180;
                  updateModelRotation(selectedModel.id, newRotation);
                }}
                onQuickRotate={(axisIndex, degrees) => {
                  const currentValue = (selectedModel.rotation[axisIndex] * 180) / Math.PI;
                  let newValue = currentValue + degrees;
                  
                  //===== -180~180 각도 제한 =====
                  newValue = Math.max(-180, Math.min(180, newValue));
                  
                  const initialRotation = [...selectedModel.rotation];
                  const newRotation = [...selectedModel.rotation];
                  newRotation[axisIndex] = (newValue * Math.PI) / 180;
                  
                  updateModelRotation(selectedModel.id, newRotation);
                  
                  addHistoryImmediate(
                    ActionType.FURNITURE_ROTATE,
                    initialRotation,
                    newRotation,
                    `가구 "${selectedModel.name || selectedModel.furnitureName || 'Unknown'}"의 ${axis}축을 ${degrees > 0 ? '+' : ''}${degrees}° 회전했습니다`
                  );
                }}
                onChangeEnd={(initialValue, finalValue) => {
                  // 초기 회전 배열 생성
                  const initialRotation = [...selectedModel.rotation];
                  initialRotation[index] = (initialValue * Math.PI) / 180;
                  
                  // 최종 회전 배열 생성
                  const finalRotation = [...selectedModel.rotation];
                  finalRotation[index] = (finalValue * Math.PI) / 180;
                  
                  addHistoryImmediate(
                    ActionType.FURNITURE_ROTATE,
                    initialRotation,
                    finalRotation,
                    `가구 "${selectedModel.name || selectedModel.furnitureName || 'Unknown'}"의 ${axis}축을 회전했습니다`
                  );
                }}
                modelName={selectedModel.name || selectedModel.furnitureName || 'Unknown'}
              />
            ))}
          </div>

          {/* 제거 버튼 */}
          <button
            onClick={() => {
              // 히스토리에 삭제 액션 기록 (삭제 전에 현재 상태 저장)
              addAction({
                type: ActionType.FURNITURE_REMOVE,
                data: {
                  furnitureId: selectedModel.id,
                  previousData: {
                    id: selectedModel.id,
                    name: selectedModel.name,
                    url: selectedModel.url,
                    position: selectedModel.position,
                    rotation: selectedModel.rotation,
                    scale: selectedModel.scale,
                    length: selectedModel.length,
                    furniture_id: selectedModel.furniture_id,
                    isCityKit: selectedModel.isCityKit,
                    texturePath: selectedModel.texturePath,
                    type: selectedModel.type,
                    furnitureName: selectedModel.furnitureName,
                    categoryId: selectedModel.categoryId,
                    object_id: selectedModel.object_id
                  }
                },
                description: `가구 "${selectedModel.name || selectedModel.furnitureName || 'Unknown'}"를 삭제했습니다`
              });
              
              // 실제 가구 삭제
              removeModel(selectedModel.id);
              deselectModel();
            }}
            className="w-full bg-blue-500 hover:bg-red-600 text-white py-3 px-4 rounded-md text-md font-semibold transition-colors flex items-center justify-center gap-2"
          >
            가구 삭제
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
  onChangeStart,
  onChangeEnd,
}) {
  const [displayValue, setDisplayValue] = useState("");
  const [initialValue, setInitialValue] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

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