import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as THREE from 'three'

function sphericalToCartesian(radius, azimuth, elevation) {
  const x = radius * Math.cos(THREE.MathUtils.degToRad(elevation)) * Math.cos(THREE.MathUtils.degToRad(azimuth));
  const y = radius * Math.sin(THREE.MathUtils.degToRad(elevation));
  const z = radius * Math.cos(THREE.MathUtils.degToRad(elevation)) * Math.sin(THREE.MathUtils.degToRad(azimuth));
  return [x, y, z];
}

export const useStore = create(
  subscribeWithSelector((set, get) => ({
    // 모델 관련 상태
    loadedModels: [],
    selectedModelId: null,
    hoveringModelId: null,
    scaleValue: 1,

    // 모델 액션들
    addModel: (model) => set((state) => ({
      loadedModels: [...state.loadedModels, {
        ...model,
        id: Date.now() + Math.random(),
        position: model.position || [
          (Math.random() - 0.5) * 15,
          0,
          (Math.random() - 0.5) * 15
        ],
        rotation: model.rotation || [0, 0, 0],
        scale: model.scale || state.scaleValue
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

    // 선택, 마우스 호버링 관련
    selectModel: (modelId) => set({ selectedModelId: modelId }),
    deselectModel: () => set({ selectedModelId: null }),
    hoveringModel: (modelId) => set({ hoveringModelId: modelId }),

    // 스케일 값 설정
    setScaleValue: (value) => set({ scaleValue: value }),

    // 빛 상태
    ambientLightIntensity: 0.4,
    directionalLightPosition: [26, 15, 0],
    directionalLightAzimuth: 0,
    directionalLightElevation: 30,
    directionalLightIntensity: 0.9,

    // 빛 액션
    setAmbientLightIntensity: (intensity) => set({ ambientLightIntensity: intensity }),
    setDirectionalLightAzimuth: (azimuth) => set({
      directionalLightAzimuth: azimuth,
      directionalLightPosition: sphericalToCartesian(30, azimuth, get().directionalLightElevation)
    }),
    setDirectionalLightElevation: (elevation) => set({
      directionalLightElevation: elevation,
      directionalLightPosition: sphericalToCartesian(30, get().directionalLightAzimuth, elevation)
    }),
    setDirectionalLightIntensity: (intensity) => set({ directionalLightIntensity: intensity }),

    // 카메라 상태
    cameraFov: 60,    // Perspective
    // cameraZoom: 50,   // Orthographic
    // cameraMode: 'perspective', // Perspective | Orthographic

    // 카메라 액션
    setCameraFov: (fov) => (
      set({ cameraFov: fov })
    ),
    // setCameraMode: (mode) => set({ cameraMode: mode }),
  }))
)