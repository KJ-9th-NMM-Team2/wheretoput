import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useStore } from "@/components/sim/useStore";
import { useHistory, ActionType } from "@/components/sim/history";
import { useDeleteKey }  from "@/components/sim/mainsim/hooks/useDeleteKey";
import { RotationControl } from "@/components/sim/mainsim/control/RotationControl";
import { CollapsibleSidebar } from "./CollapsibleSidebar";
import { handleStackModel as stackModel } from "@/components/sim/mainsim/utils/stackUtils";

export function SelectedModelEditModal() {
  const {
    loadedModels,
    selectedModelId,
    selectModel,
    hoveringModel,
    removeModel,
    updateModelPosition,
    updateModelRotation,
    updateModelScale,
    deselectModel,
    isStackingMode,
    setIsStackingMode,
    stackingBaseModel,
    setStackingBaseModel,
  } = useStore();

  const { addAction } = useHistory();

  // 히스토리 기록을 위한 초기값 저장
  const initialValuesRef = useRef({});
  const debounceTimersRef = useRef({});

  // 선택된 모델 찾기
  const selectedModel = loadedModels.find(
    (model) => model.id === selectedModelId
  );

  // Delete 키 단축키 처리
  useDeleteKey(selectedModel, addAction, removeModel, deselectModel);

  // 모델이 선택될 때 초기값 저장
  useEffect(() => {
    if (selectedModel) {
      initialValuesRef.current = {
        scale: Array.isArray(selectedModel.scale)
          ? selectedModel.scale[0]
          : selectedModel.scale,
        position: [...selectedModel.position],
        rotation: [...selectedModel.rotation],
      };
    }
  }, [selectedModelId]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      Object.values(debounceTimersRef.current).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  // 디바운스된 히스토리 기록 함수
  const debouncedAddHistory = useCallback(
    (type, currentValue, initialValue, description) => {
      const timerKey = type;

      // 기존 타이머 클리어
      if (debounceTimersRef.current[timerKey]) {
        clearTimeout(debounceTimersRef.current[timerKey]);
      }

      // 새 타이머 설정
      debounceTimersRef.current[timerKey] = setTimeout(() => {
        if (
          selectedModel &&
          JSON.stringify(currentValue) !== JSON.stringify(initialValue)
        ) {
          addAction({
            type,
            data: {
              furnitureId: selectedModel.id,
              [type === ActionType.FURNITURE_SCALE
                ? "scale"
                : type === ActionType.FURNITURE_ROTATE
                  ? "rotation"
                  : "position"]:
                type === ActionType.FURNITURE_SCALE
                  ? { x: currentValue, y: currentValue, z: currentValue }
                  : type === ActionType.FURNITURE_ROTATE
                    ? {
                      x: currentValue[0],
                      y: currentValue[1],
                      z: currentValue[2],
                    }
                    : {
                      x: currentValue[0],
                      y: currentValue[1],
                      z: currentValue[2],
                    },
              previousData: {
                [type === ActionType.FURNITURE_SCALE
                  ? "scale"
                  : type === ActionType.FURNITURE_ROTATE
                    ? "rotation"
                    : "position"]:
                  type === ActionType.FURNITURE_SCALE
                    ? { x: initialValue, y: initialValue, z: initialValue }
                    : type === ActionType.FURNITURE_ROTATE
                      ? {
                        x: initialValue[0],
                        y: initialValue[1],
                        z: initialValue[2],
                      }
                      : {
                        x: initialValue[0],
                        y: initialValue[1],
                        z: initialValue[2],
                      },
              },
            },
            description,
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
    },
    [selectedModel, addAction]
  );

  // 즉시 히스토리 기록 함수 (마우스 이벤트 기반)
  const addHistoryImmediate = useCallback(
    (type, initialValue, finalValue, description) => {
      if (
        selectedModel &&
        JSON.stringify(initialValue) !== JSON.stringify(finalValue)
      ) {
        addAction({
          type,
          data: {
            furnitureId: selectedModel.id,
            [type === ActionType.FURNITURE_SCALE
              ? "scale"
              : type === ActionType.FURNITURE_ROTATE
                ? "rotation"
                : "position"]:
              type === ActionType.FURNITURE_SCALE
                ? { x: finalValue, y: finalValue, z: finalValue }
                : type === ActionType.FURNITURE_ROTATE
                  ? { x: finalValue[0], y: finalValue[1], z: finalValue[2] }
                  : { x: finalValue[0], y: finalValue[1], z: finalValue[2] },
            previousData: {
              [type === ActionType.FURNITURE_SCALE
                ? "scale"
                : type === ActionType.FURNITURE_ROTATE
                  ? "rotation"
                  : "position"]:
                type === ActionType.FURNITURE_SCALE
                  ? { x: initialValue, y: initialValue, z: initialValue }
                  : type === ActionType.FURNITURE_ROTATE
                    ? {
                      x: initialValue[0],
                      y: initialValue[1],
                      z: initialValue[2],
                    }
                    : {
                      x: initialValue[0],
                      y: initialValue[1],
                      z: initialValue[2],
                    },
            },
          },
          description,
        });
      }
    },
    [selectedModel, addAction]
  );

  // 쌓기 모드 시작 함수 - 현재 선택된 모델을 아래(기준)로 설정
  const handleStartStackingMode = useCallback(() => {
    if (!selectedModel) return;

    // 현재 선택된 모델을 기준(아래) 모델로 설정
    setStackingBaseModel(selectedModel);
    setIsStackingMode(true);

    // 선택 해제해서 위에 올릴 물체를 선택할 수 있게 함
    deselectModel();
  }, [selectedModel, setStackingBaseModel, setIsStackingMode, deselectModel]);

  // 쌓기 실행 함수 - 위에 올릴 모델이 선택되면 실행
  useEffect(() => {
    if (
      isStackingMode &&
      stackingBaseModel &&
      selectedModel &&
      selectedModel.id !== stackingBaseModel.id
    ) {
      // 쌓기 실행 (selectedModel을 stackingBaseModel 위에 올림)
      stackModel({
        selectedModel,
        stackableModel: stackingBaseModel, // 기준이 되는 모델
        updateModelPosition,
        addAction,
        loadedModels, // 최신 상태의 모델 배열 전달
      });

      // 쌓기 완료 후 모드 종료
      setIsStackingMode(false);
      setStackingBaseModel(null);
    }
  }, [
    isStackingMode,
    stackingBaseModel,
    selectedModel,
    updateModelPosition,
    addAction,
    setIsStackingMode,
    setStackingBaseModel,
  ]);

  // 쌓기 모드일 때 표시할 UI
  if (isStackingMode && !selectedModel) {
    return (
      <CollapsibleSidebar
        title="쌓기 모드"
        onClose={() => {
          setIsStackingMode(false);
          setStackingBaseModel(null);
        }}
        defaultCollapsed={false}
      >
        <div className="p-4 select-none">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="font-bold mb-3 text-sm">
              위에 올릴 가구를 선택하세요
            </div>
            <div className="text-xs text-gray-500">
              다른 물체를 클릭하면{" "}
              {stackingBaseModel?.name ||
                stackingBaseModel?.furnitureName ||
                "기존 가구"}{" "}
              위에 올라갑니다.
            </div>
            <button
              onClick={() => {
                setIsStackingMode(false);
                setStackingBaseModel(null);
              }}
              className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md text-sm font-semibold transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </CollapsibleSidebar>
    );
  }

  // 선택된 모델이 없을 시 가구 목록 표시
  if (!selectedModel) {
    return (
      <CollapsibleSidebar
        title={`가구 목록 (${loadedModels.length}개)`}
        defaultCollapsed={true}
      >
        <div className="flex flex-col gap-2 overflow-auto p-4 select-none">
          {loadedModels.map((model) => (
            <button className="w-full bg-gray-50 border-gray-300 hover:bg-green-50 hover:border-green-300 active:bg-gradient-to-r active:from-green-500 active:to-green-600 active:text-white border-2 rounded-lg p-3 text-left text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer transition-all duration-200"
              key={model.id}
              onClick={() => {
                selectModel(model.id);
                hoveringModel(null);
              }}
              onMouseEnter={() => hoveringModel(model.id)}
              onMouseLeave={() => hoveringModel(null)}
            >
              {model.name}
            </button>
          ))}
        </div>
      </CollapsibleSidebar>
    );
  }

  return (
    <CollapsibleSidebar
      title="가구 편집"
      onClose={deselectModel}
      defaultCollapsed={false}
    >
      <div className="p-4 select-none">
        {/* 가구이름 표시 */}
        <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="font-bold mb-3 text-sm flex items-center gap-2 break-words text-gray-800">
            {selectedModel.name}
          </div>

          {/* 크기 조정 */}
          <div className="mb-4 font-bold ">
            <ControlSlider
              label={`W ${Math.ceil(
                selectedModel.length[0] *
                (Array.isArray(selectedModel.scale)
                  ? selectedModel.scale[0]
                  : selectedModel.scale)

              )} × H${Math.ceil(

                selectedModel.length[1] *
                (Array.isArray(selectedModel.scale)
                  ? selectedModel.scale[1]
                  : selectedModel.scale)

              )} × D${Math.ceil(
                selectedModel.length[2] *
                (Array.isArray(selectedModel.scale)
                  ? selectedModel.scale[2]
                  : selectedModel.scale)
              )}`}

              value={
                Array.isArray(selectedModel.scale)
                  ? selectedModel.scale[0]
                  : selectedModel.scale
              }
              unit="x"
              min={0.1}
              max={3}
              step={0.1}
              onChange={(value) => updateModelScale(selectedModel.id, value)}
              onChangeEnd={(initialValue, finalValue) => {
                addHistoryImmediate(
                  ActionType.FURNITURE_SCALE,
                  initialValue,
                  finalValue,
                  `가구 "${selectedModel.name ||
                  selectedModel.furnitureName ||
                  "Unknown"
                  }"의 크기를 변경했습니다`
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
                  `가구 "${selectedModel.name ||
                  selectedModel.furnitureName ||
                  "Unknown"
                  }"의 높이를 변경했습니다`
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
                  const currentValue =
                    (selectedModel.rotation[axisIndex] * 180) / Math.PI;
                  let newValue = (currentValue + 360 + degrees) % 360;

                  const initialRotation = [...selectedModel.rotation];
                  const newRotation = [...selectedModel.rotation];
                  newRotation[axisIndex] = (newValue * Math.PI) / 180;

                  updateModelRotation(selectedModel.id, newRotation);

                  addHistoryImmediate(
                    ActionType.FURNITURE_ROTATE,
                    initialRotation,
                    newRotation,
                    `가구 "${selectedModel.name ||
                    selectedModel.furnitureName ||
                    "Unknown"
                    }"의 ${axis}축을 ${degrees > 0 ? "+" : ""
                    }${degrees}° 회전했습니다`
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
                    `가구 "${selectedModel.name ||
                    selectedModel.furnitureName ||
                    "Unknown"
                    }"의 ${axis}축을 회전했습니다`
                  );
                }}
              />
            ))}
          </div>

          {/* 버튼들 - 한 줄로 배치 */}
          <div className="flex gap-2">
            {/* 쌓기 버튼 */}
            <button
              onClick={handleStartStackingMode}
              className="tool-btn tool-btn-green-active flex-1"

            >
              쌓기
            </button>

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
                      object_id: selectedModel.object_id,
                    },
                  },
                  description: `가구 "${selectedModel.name ||
                    selectedModel.furnitureName ||
                    "Unknown"
                    }"를 삭제했습니다`,
                });

                // 실제 가구 삭제
                removeModel(selectedModel.id);
                deselectModel();
              }}
              className="tool-btn tool-btn-red-active flex-1"

            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </CollapsibleSidebar>
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
    if (value === undefined || value === null) setDisplayValue("");
    else setDisplayValue(formatValue(value));
  }, [value, step]);

  return (
    <div className="mb-3">
      {/* 라벨과 값 표시 */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-600">{label}</span>
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

              if (val === "" || val === "-" || val === ".") return;
              onChange(parseFloat(val));
            }}
            onBlur={() => {
              if (
                displayValue === "" ||
                displayValue === "-" ||
                displayValue === "."
              ) {
                const fallback = formatValue(defaultValue);
                setDisplayValue(fallback);
                onChange(parseFloat(fallback));
              }
            }}
            className="w-12 text-xs text-right bg-transparent border-none outline-none text-gray-700"
          />
          <span className="text-xs text-gray-500 ml-1">{unit}</span>
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
            if (onChangeEnd)
              onChangeEnd(initialValue, parseFloat(e.target.value));
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
