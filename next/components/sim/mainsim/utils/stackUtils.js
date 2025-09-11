import { ActionType } from "@/components/sim/history";

/**
 * 가구를 다른 가구 위에 쌓는 함수
 * @param {Object} selectedModel - 쌓을 가구 모델
 * @param {Object} stackableModel - 대상이 되는 가구 모델
 * @param {Function} updateModelPosition - 위치 업데이트 함수
 * @param {Function} addAction - 히스토리 액션 추가 함수
 * @param {Array} loadedModels - 현재 로드된 모델 배열 (최신 상태)
 */
export const handleStackModel = ({
  selectedModel,
  stackableModel,
  updateModelPosition,
  addAction,
  loadedModels,
}) => {
  if (!selectedModel || !stackableModel) return;

  const initialPosition = [...selectedModel.position];

  // loadedModels에서 stackableModel의 최신 위치 정보 가져오기
  const currentStackableModel = loadedModels 
    ? loadedModels.find(model => model.id === stackableModel.id) 
    : stackableModel;
  
  const currentBaseModel = currentStackableModel || stackableModel;

  // 타겟 모델의 높이 계산 (스케일 고려)
  const targetHeight =
    (currentBaseModel.length[1] / 1000) *
    (Array.isArray(currentBaseModel.scale)
      ? currentBaseModel.scale[1]
      : currentBaseModel.scale);

  // 새로운 Y 위치 계산 (타겟 모델 위에 배치)
  const newY = currentBaseModel.position[1] + targetHeight;

  // 베이스 모델과 쌓을 모델의 크기 계산
  const baseWidth = (currentBaseModel.length[0] / 1000) * (Array.isArray(currentBaseModel.scale) ? currentBaseModel.scale[0] : currentBaseModel.scale);
  const baseDepth = (currentBaseModel.length[2] / 1000) * (Array.isArray(currentBaseModel.scale) ? currentBaseModel.scale[2] : currentBaseModel.scale);
  
  const selectedWidth = (selectedModel.length[0] / 1000) * (Array.isArray(selectedModel.scale) ? selectedModel.scale[0] : selectedModel.scale);
  const selectedDepth = (selectedModel.length[2] / 1000) * (Array.isArray(selectedModel.scale) ? selectedModel.scale[2] : selectedModel.scale);
  
  // 베이스 모델 안에서 쌓을 모델이 들어갈 수 있는 최대 오프셋 계산
  const maxOffsetX = Math.max(0, (baseWidth - selectedWidth) / 2);
  const maxOffsetZ = Math.max(0, (baseDepth - selectedDepth) / 2);
  
  const offsetX = (Math.random() - 0.5) * 2 * maxOffsetX; // 베이스 경계 안에서만
  const offsetZ = (Math.random() - 0.5) * 2 * maxOffsetZ; // 베이스 경계 안에서만
  
  // 위치 업데이트
  const newPosition = [
    currentBaseModel.position[0] + offsetX,
    newY, // Y 좌표는 타겟 위로
    currentBaseModel.position[2] + offsetZ,
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
      currentBaseModel.name || currentBaseModel.furnitureName || "Unknown"
    }" 위에 쌓았습니다`,
  });

};
