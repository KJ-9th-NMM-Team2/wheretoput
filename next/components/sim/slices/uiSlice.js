export const uiSlice = (set, get) => ({
  // 선택된 카테고리
  selectedCategory: 99,
  setSelectedCategory: (categoryId) =>
    set({ selectedCategory: categoryId }),

  // 보기/편집 모드
  viewOnly: false,
  setViewOnly: (value) => set({ viewOnly: value }),

  // 규격 정보 표시 여부
  showSpecifications: false,
  setShowSpecifications: (value) => set({ showSpecifications: value }),

  // 업적 상태
  setAchievements: (achievements) => set({ achievements }),
});