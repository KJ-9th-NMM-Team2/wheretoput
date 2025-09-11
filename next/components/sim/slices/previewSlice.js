export const previewSlice = (set, get) => ({
  // 프리뷰 모드 관련 상태
  previewMode: false, // 위치 선택 모드
  currentPreviewFurniture: null, // 프리뷰 중인 가구 정보
  previewPosition: [0, 0, 0], // 프리뷰 위치
  previewAbortController: null, // fetch 취소용 AbortController

  // 프리뷰 모드 액션들
  setPreviewMode: (enabled) => set({ previewMode: enabled }),
  setCurrentPreviewFurniture: (furniture) =>
    set({ currentPreviewFurniture: furniture }),
  setPreviewPosition: (position) => set({ previewPosition: position }),

  // 프리뷰 모드 시작
  startPreviewMode: (furnitureData, abortController = null) => {
    const state = get();
    // 기존 프리뷰 모드가 있으면 완전히 취소 (배치하지 않음)
    if (state.previewMode) {
      console.log("기존 프리뷰 취소:", state.currentPreviewFurniture?.name);
      // fetch 취소
      if (state.previewAbortController) {
        state.previewAbortController.abort();
      }
      // 명시적으로 프리뷰 모드를 false로 설정하여 확실히 취소
      set({
        previewMode: false,
        currentPreviewFurniture: null,
        previewPosition: [0, 0, 0],
        previewAbortController: null,
      });
    }

    // 새로운 프리뷰 모드 시작
    set({
      previewMode: true,
      currentPreviewFurniture: furnitureData,
      previewPosition: [0, 0, 0],
      previewAbortController: abortController,
    });
  },

  // 프리뷰 모드 종료 (가구 배치)
  confirmPreview: () => {
    const state = get();
    if (state.currentPreviewFurniture && state.previewMode) {
      const newModel = {
        ...state.currentPreviewFurniture,
        position: state.previewPosition,
      };

      // 히스토리에 액션 추가 (원본 아이템 정보가 있는 경우)
      if (newModel._originalItem && newModel._addAction) {
        newModel._addAction({
          type: "FURNITURE_ADD", // ActionType.FURNITURE_ADD
          data: {
            furnitureId: newModel.id,
            previousData: newModel,
          },
          description: `${newModel._originalItem.name} 추가`,
        });

        // 임시 데이터 제거
        delete newModel._originalItem;
        delete newModel._addAction;
      }

      get().addModel(newModel);
      set({
        previewMode: false,
        currentPreviewFurniture: null,
        previewPosition: [0, 0, 0],
        previewAbortController: null,
      });
    }
  },

  // 프리뷰 모드 취소
  cancelPreview: () => {
    const state = get();
    // 진행 중인 fetch 취소
    if (state.previewAbortController) {
      state.previewAbortController.abort();
    }
    set({
      previewMode: false,
      currentPreviewFurniture: null,
      previewPosition: [0, 0, 0],
      previewAbortController: null,
    });
  },
});