import { ActionType } from "@/components/sim/history";

/**
 * 가구를 다른 가구 위에 쌓는 함수
 * @param {Object} selectedModel - 쌓을 가구 모델
 * @param {Object} stackableModel - 대상이 되는 가구 모델
 * @param {Function} updateModelPosition - 위치 업데이트 함수
 * @param {Function} addAction - 히스토리 액션 추가 함수
 * @param {Function} setIsStackable - 쌓기 가능 상태 설정 함수
 * @param {Function} setStackableModel - 쌓기 대상 모델 설정 함수
 */
export const handleStackModel = ({
  selectedModel,
  stackableModel,
  updateModelPosition,
  addAction,
  setIsStackable,
  setStackableModel,
}) => {
  if (!selectedModel || !stackableModel) return;

  const initialPosition = [...selectedModel.position];

  // 타겟 모델의 높이 계산 (스케일 고려)
  const targetHeight =
    (stackableModel.length[1] / 1000) *
    (Array.isArray(stackableModel.scale)
      ? stackableModel.scale[1]
      : stackableModel.scale);

  // 새로운 Y 위치 계산 (타겟 모델 위에 배치)
  const newY = stackableModel.position[1] + targetHeight;

  // 위치 업데이트
  const newPosition = [
    stackableModel.position[0],
    newY, // Y 좌표는 타겟 위로
    stackableModel.position[2],
  ];

  updateModelPosition(selectedModel.id, newPosition);

  // 히스토리에 기록
  addAction({
    type: ActionType.FURNITURE_MOVE,
    data: {
      furnitureId: selectedModel.id,
      position: { x: newPosition[0], y: newPosition[1], z: newPosition[2] },
      previousData: {
        position: {
          x: initialPosition[0],
          y: initialPosition[1],
          z: initialPosition[2],
        },
      },
    },
    description: `가구 "${
      selectedModel.name || selectedModel.furnitureName || "Unknown"
    }"를 "${
      stackableModel.name || stackableModel.furnitureName || "Unknown"
    }" 위에 쌓았습니다`,
  });

  // 쌓기 완료 후 상태 초기화
  setIsStackable(false);
  setStackableModel(null);
};
