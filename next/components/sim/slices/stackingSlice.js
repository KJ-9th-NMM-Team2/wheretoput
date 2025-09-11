export const stackingSlice = (set, get) => ({
  // 쌓기 모드 상태 (버튼 클릭 시 활성화)
  isStackingMode: false,
  setIsStackingMode: (value) => set({ isStackingMode: value }),
  stackingBaseModel: null, // 아래에 있을 기준 모델
  setStackingBaseModel: (model) => set({ stackingBaseModel: model }),
});