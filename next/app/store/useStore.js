import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export const useStore = create(
  subscribeWithSelector((set, get) => ({
    // 모델 관련 상태
    loadedModels: [],
    selectedModelId: null,
    scaleValue: 1,
    
    // 고양이 캐릭터 상태
    catPosition: [0, 0, 2],
    
    // 벽 검출 상태
    detectedWalls: [],
    wallDetectionParams: {
      morphType: 1,      // CLOSE 연산으로 변경 (bedroom에서 격자 필터링에 더 효과적)
      canny1: 50,
      canny2: 150,
      houghTh: 80,
      minLen: 30,
      maxGap: 20
    },
    
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
      loadedModels: state.loadedModels.map(model =>
        model.id === modelId ? { ...model, position: newPosition } : model
      )
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
    
    // 고양이 위치 업데이트
    updateCatPosition: (newPosition) => set({ catPosition: newPosition }),
    
    // 벽 검출 관련
    setDetectedWalls: (walls) => set({ detectedWalls: walls }),
    setWallDetectionParams: (params) => set((state) => ({
      wallDetectionParams: { ...state.wallDetectionParams, ...params }
    })),
    
    // 3D 좌표 변환 함수
    convertWallsTo3D: (wallLines, imageWidth, imageHeight) => {
      const scale = 20 / Math.max(imageWidth, imageHeight)
      const offsetX = -10
      const offsetZ = -10
      
      return wallLines.map((line, index) => {
        const x1 = (line.x1 * scale) + offsetX
        const z1 = ((imageHeight - line.y1) * scale) + offsetZ
        const x2 = (line.x2 * scale) + offsetX
        const z2 = ((imageHeight - line.y2) * scale) + offsetZ
        
        const centerX = (x1 + x2) / 2
        const centerZ = (z1 + z2) / 2
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2))
        const rotation = Math.atan2(z2 - z1, x2 - x1)
        
        return {
          id: `wall-${index}`,
          position: [centerX, 2.5, centerZ],
          rotation: [0, rotation, 0],
          width: length,
          height: 5
        }
      })
    }
  }))
)