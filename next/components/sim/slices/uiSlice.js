export const uiSlice = (set, get) => ({
  // 선택된 카테고리
  selectedCategory: 99,
  setSelectedCategory: (categoryId) =>
    set({ selectedCategory: categoryId }),

  // 보기/편집 모드
  viewOnly: false,
  setViewOnly: (value) => set({ viewOnly: value }),

  // 측정 기능 상태
  showMeasurements: false,
  setShowMeasurements: (show) => set({ showMeasurements: show }),

  // 캡처 모달 상태
  showCaptureModal: false,
  setShowCaptureModal: (show) => set({ showCaptureModal: show }),
  capturedImageData: null,
  setCapturedImageData: (imageData) => set({ capturedImageData: imageData }),
  shouldCaptureModal: false,
  setShouldCaptureModal: (should) => set({ shouldCaptureModal: should }),

  // 업적 상태
  setAchievements: (achievements) => set({ achievements }),
});