import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export const useStore = create(
  subscribeWithSelector((set, get) => ({
    // 모델 관련 상태
    loadedModels: [],
    selectedModelId: null,
    scaleValue: 1,

    // 모델 액션들
    addModel: (model) => set((state) => ({
      loadedModels: [...state.loadedModels, {
        ...model,
        id: Date.now() + Math.random(),
        position: [
          (Math.random() - 0.5) * 15,
          0,
          (Math.random() - 0.5) * 15
        ],
        rotation: [0, 0, 0],
        scale: state.scaleValue
      }]
    })),

    removeModel: (modelId) => set((state) => {
      const model = state.loadedModels.find(m => m.id === modelId)
      if (model && model.url) {
        URL.revokeObjectURL(model.url)
      }
      return {
        loadedModels: state.loadedModels.filter(m => m.id !== modelId)
      }
    }),

    clearAllModels: () => set((state) => {
      state.loadedModels.forEach(model => {
        if (model.url) URL.revokeObjectURL(model.url)
      })
      return { loadedModels: [] }
    }),

    updateModelPosition: (modelId, newPosition) => set((state) => ({
      loadedModels: state.loadedModels.map(model => (
        model.id === modelId ? { ...model, position: newPosition } : model
      ))
    })),

    updateModelRotation: (modelId, newRotation) => set((state) => ({
      loadedModels: state.loadedModels.map(model =>
        model.id === modelId ? { ...model, rotation: newRotation } : model
      )
    })),

    updateModelScale: (modelId, newScale) => set((state) => ({
      loadedModels: state.loadedModels.map(model =>
        model.id === modelId ? { ...model, scale: newScale } : model
      )
    })),

    // 선택 관련
    selectModel: (modelId) => set({ selectedModelId: modelId }),
    deselectModel: () => set({ selectedModelId: null }),

    // 스케일 값 설정
    setScaleValue: (value) => set({ scaleValue: value }),

    // 빛 상태
    AmbientLightIntensity: 0.3,
    directionalLightPosition: [-5, 10, -5],
    directionalLightIntensity: 1,

    // 빛 액션
    setAmbientLightIntensity: (intensity) => set({ AmbientLightIntensity: intensity }),
    setDirectionalLightPosition: (position) => set({ directionalLightPosition: position }),
    setDirectionalLightIntensity: (intensity) => set({ directionalLightIntensity: intensity }),

    // 카메라 상태
    cameraFov: 60,

    // 카메라 액션
    setCameraFov: (fov) => (
      set({ cameraFov: fov })
    )
  }))
)