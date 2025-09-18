export const modelSlice = (set, get) => ({
  // 모델 관련 상태
  loadedModels: [],
  selectedModelId: null,
  hoveringModelId: null,
  scaleValue: 1,

  // 모델 액션들
  addModel: (model, shouldBroadcast = true) =>
    set((state) => {
      // scale 값 검증 및 최소값 보장
      let scale = model.scale || state.scaleValue;
      if (Array.isArray(scale)) {
        scale = scale.map((s) => (s <= 0 || s < 0.01 ? 1 : s));
      } else if (typeof scale === "number") {
        scale = scale <= 0 || scale < 0.01 ? 1 : scale;
      } else {
        scale = 1;
      }

      const result = {
        loadedModels: [
          ...state.loadedModels,
          {
            ...model,
            id: model.id || crypto.randomUUID(),
            furniture_id: model.furniture_id || null, // null일 수 있음
            position: model.position || [
              (Math.random() - 0.5) * 15,
              0,
              (Math.random() - 0.5) * 15,
            ],
            rotation: model.rotation || [0, 0, 0],
            scale: scale,
          },
        ],
      };

      // Socket 브로드캐스트 (협업 모드이고 브로드캐스트가 필요한 경우)
      if (shouldBroadcast) {
        get().broadcastWithThrottle(
          "broadcastModelAdd",
          model.id,
          model,
          0
        );
      }

      return result;
    }),

  // 히스토리 복원용: 기존 ID를 유지하면서 모델 추가
  addModelWithId: (model, shouldBroadcast = true) =>
    set((state) => {
      // 같은 ID의 기존 모델 제거 (중복 방지)
      const filteredModels = state.loadedModels.filter(
        (m) => m.id !== model.id
      );

      // scale 값 검증 및 최소값 보장
      let scale = model.scale || state.scaleValue;
      if (Array.isArray(scale)) {
        scale = scale.map((s) => (s <= 0 || s < 0.01 ? 1 : s));
      } else if (typeof scale === "number") {
        scale = scale <= 0 || scale < 0.01 ? 1 : scale;
      } else {
        scale = 1;
      }

      const result = {
        loadedModels: [
          ...filteredModels,
          {
            ...model,
            // ID를 유지 (히스토리 복원용)
            id: model.id,
            furniture_id: model.furniture_id || null, // null일 수 있음
            position: model.position || [0, 0, 0],
            rotation: model.rotation || [0, 0, 0],
            scale: scale,
          },
        ],
      };

      // Socket 브로드캐스트 (협업 모드이고 브로드캐스트가 필요한 경우)
      if (shouldBroadcast) {
        get().broadcastWithThrottle(
          "broadcastModelAddWithId",
          model.id,
          model,
          0
        );
      }

      return result;
    }),

  removeModel: (modelId, shouldBroadcast = true) =>
    set((state) => {
      const model = state.loadedModels.find((m) => m.id === modelId);
      if (model && model.url) {
        URL.revokeObjectURL(model.url);
      }
      const result = {
        loadedModels: state.loadedModels.filter((m) => m.id !== modelId),
      };

      if (shouldBroadcast) {
        get().broadcastWithThrottle(
          "broadcastModelRemove",
          modelId,
          null,
          0
        );
      }

      return result;
    }),

  clearAllModels: () =>
    set((state) => {
      state.loadedModels.forEach((model) => {
        if (model.url) URL.revokeObjectURL(model.url);
      });
      return { loadedModels: [] };
    }),

  updateModelPosition: (modelId, newPosition, shouldBroadcast = true) => {
    set((state) => {
      // 상태 업데이트
      const newState = {
        loadedModels: state.loadedModels.map((model) =>
          model.id === modelId ? { ...model, position: newPosition } : model
        ),
      };

      // Socket 브로드캐스트 (협업 모드이고 브로드캐스트가 필요한 경우)
      if (shouldBroadcast) {
        get().broadcastWithThrottle(
          "broadcastModelMove",
          modelId,
          newPosition,
          30
        );
      }

      return newState;
    });
  },

  // 소켓 브로드캐스트
  updateModelRotation: (modelId, newRotation, shouldBroadcast = true) =>
    set((state) => {
      const newState = {
        // 상태 업데이트
        loadedModels: state.loadedModels.map((model) =>
          model.id === modelId ? { ...model, rotation: newRotation } : model
        ),
      };

      // Socket 브로드캐스트 (협업 모드이고 브로드캐스트가 필요한 경우)
      if (shouldBroadcast) {
        get().broadcastWithThrottle(
          "broadcastModelRotate",
          modelId,
          newRotation,
          30
        );
      }

      return newState;
    }),

  updateModelScale: (modelId, newScale, shouldBroadcast = true) =>
    set((state) => {
      // scale 값 검증 및 최소값 보장
      let scale = newScale;
      if (Array.isArray(scale)) {
        scale = scale.map((s) => (s <= 0 || s < 0.01 ? 0.01 : s));
      } else if (typeof scale === "number") {
        scale = scale <= 0 || scale < 0.01 ? 0.01 : scale;
      } else {
        scale = 1;
      }

      const newState = {
        loadedModels: state.loadedModels.map((model) =>
          model.id === modelId ? { ...model, scale: scale } : model
        ),
      };

      if (shouldBroadcast) {
        get().broadcastWithThrottle(
          "broadcastModelScale",
          modelId,
          scale,
          30
        );
      }

      return newState;
    }),

  // 모델 URL 업데이트 (로딩 완료 시 사용)
  updateModelUrl: (modelId, newUrl) =>
    set((state) => ({
      loadedModels: state.loadedModels.map((model) =>
        model.id === modelId ? { ...model, url: newUrl } : model
      ),
    })),

  // 선택, 마우스 호버링 관련
  selectModel: (modelId, shouldBroadcast = true) => {
    set({ selectedModelId: modelId });
    if (shouldBroadcast) {
      get().broadcastWithThrottle("broadcastModelSelect", modelId, null, 0);
    }
  },

  deselectModel: (shouldBroadcast = true) => {
    const currentSelectedId = get().selectedModelId;
    set({ selectedModelId: null, snappedWallInfo: null });
    if (shouldBroadcast) {
      get().broadcastWithThrottle(
        "broadcastModelDeselect",
        currentSelectedId,
        null,
        0
      );
    }
  },

  hoveringModel: (modelId) => set({ hoveringModelId: modelId }),

  // 스케일 값 설정
  setScaleValue: (value) => set({ scaleValue: value }),

  // 각 모델의 getSelectionBoxSize 함수들을 저장
  modelBoundingBoxFunctions: new Map(),
  registerModelBoundingBoxFunction: (modelId, boundingBoxFn) =>
    set((state) => {
      const newMap = new Map(state.modelBoundingBoxFunctions);
      newMap.set(modelId, boundingBoxFn);
      return { modelBoundingBoxFunctions: newMap };
    }),
  unregisterModelBoundingBoxFunction: (modelId) =>
    set((state) => {
      const newMap = new Map(state.modelBoundingBoxFunctions);
      newMap.delete(modelId);
      return { modelBoundingBoxFunctions: newMap };
    }),

});