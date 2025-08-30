import { directPointLight } from 'three/tsl';
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
    cameraFov: 60,

    // 카메라 액션
    setCameraFov: (fov) => (
      set({ cameraFov: fov })
    ),

    // 저장/로드 상태
    currentRoomId: null,
    isSaving: false,
    isLoading: false,
    lastSavedAt: null,

    // 저장/로드 액션
    setCurrentRoomId: (roomId) => set({ currentRoomId: roomId }),
    
    setSaving: (saving) => set({ isSaving: saving }),
    
    setLoading: (loading) => set({ isLoading: loading }),
    
    // 시뮬레이터 상태 저장
    saveSimulatorState: async () => {
      const state = get();
      if (!state.currentRoomId) {
        throw new Error('방 ID가 설정되지 않았습니다');
      }

      set({ isSaving: true });

      try {
        const objects = state.loadedModels.map(model => {
          // furniture_id가 없는 경우 (직접 업로드한 GLB) 임시 UUID 생성하지 않고 null 유지
          return {
            furniture_id: model.furniture_id, // null일 수 있음
            position: model.position,
            rotation: model.rotation,
            scale: Array.isArray(model.scale) ? model.scale : [model.scale, model.scale, model.scale],
            url: model.url,
            isCityKit: model.isCityKit || false,
            texturePath: model.texturePath || null,
            type: model.type || 'glb'
          };
        });

        // 임시 room_id인 경우 먼저 방 생성
        if (state.currentRoomId.startsWith('temp_')) {
          const floorPlanData = JSON.parse(localStorage.getItem('floorPlanData') || '{}');
          const roomData = floorPlanData.roomData || {};
          
          // 방 생성
          const createRoomResponse = await fetch('/api/rooms', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: roomData.title || `Room ${new Date().toLocaleString()}`,
              description: roomData.description || 'Generated room',
              room_data: floorPlanData,
              is_public: roomData.is_public || false
            })
          });

          if (!createRoomResponse.ok) {
            throw new Error('방 생성 실패');
          }

          const roomResult = await createRoomResponse.json();
          const newRoomId = roomResult.room_id;
          
          // 새로운 room_id로 업데이트
          set({ currentRoomId: newRoomId });
          
          // URL도 업데이트 (임시로 현재 URL 수정)
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', `/sim/${newRoomId}`);
          }
          
          console.log(`새 방 생성 완료: ${newRoomId}`);
        }

        // 가구 데이터 저장 (새 room_id 또는 기존 room_id 사용)
        const currentState = get();
        const response = await fetch('/api/sim/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            room_id: currentState.currentRoomId,
            objects: objects
          })
        });

        if (!response.ok) {
          throw new Error(`저장 실패: ${response.statusText}`);
        }

        const result = await response.json();
        set({ lastSavedAt: new Date() });
        console.log('시뮬레이터 상태 저장 완료:', result);
        return result;

      } catch (error) {
        console.error('저장 중 오류:', error);
        throw error;
      } finally {
        set({ isSaving: false });
      }
    },

    // 시뮬레이터 상태 로드
    loadSimulatorState: async (roomId) => {
      set({ isLoading: true });

      try {
        const response = await fetch(`/api/sim/load/${roomId}`);
        
        if (!response.ok) {
          throw new Error(`로드 실패: ${response.statusText}`);
        }

        const result = await response.json();
        
        // 기존 모델들 정리
        const currentState = get();
        currentState.loadedModels.forEach(model => {
          if (model.url) URL.revokeObjectURL(model.url);
        });

        // 로드된 객체들을 loadedModels에 설정
        const loadedModels = result.objects.map(obj => ({
          id: obj.id,
          object_id: obj.object_id,
          furniture_id: obj.furniture_id,
          name: obj.name, // InfoPanel에서 사용하는 name 속성 추가
          position: obj.position,
          rotation: obj.rotation,
          scale: obj.scale,
          url: obj.url,
          isCityKit: obj.isCityKit,
          texturePath: obj.texturePath,
          type: obj.type,
          furnitureName: obj.furnitureName,
          categoryId: obj.categoryId
        }));

        set({ 
          loadedModels: loadedModels,
          currentRoomId: roomId,
          selectedModelId: null
        });

        console.log(`시뮬레이터 상태 로드 완료: ${result.loaded_count}개 객체`);
        console.log('로드된 객체들:', loadedModels);
        loadedModels.forEach((model, index) => {
          console.log(`모델 ${index}:`, {
            id: model.id,
            name: model.name,
            position: model.position,
            scale: model.scale,
            url: model.url
          });
        });
        return result;

      } catch (error) {
        console.error('로드 중 오류:', error);
        throw error;
      } finally {
        set({ isLoading: false });
      }
    }
  }))
)