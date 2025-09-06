
import { useEffect, useRef, useCallback } from 'react';
import { useStore } from './useStore.js';

interface AutoSaveProps {
  interval?: number; // 자동저장 간격 (밀리초)
  enabled?: boolean; // 자동저장 활성화 여부
}

// - ( interval)초마다 자동으로 상태 저장
// - 상태 변경이 있을 때만 저장하여 불필요한 API 호출 방지
// - 저장 중일 때는 중복 저장 방지
// - 자동저장은 편집모드 일때만 활성화
// - 자신의 방(isOwnUserRoom)일 때만 자동저장 작동
  
export default function AutoSave({ 
  interval = 10000, // 기본
  enabled = true 
}: AutoSaveProps) {
  const saveSimulatorState = useStore((state) => state.saveSimulatorState);
  const isSaving = useStore((state) => state.isSaving);
  const currentRoomId = useStore((state) => state.currentRoomId);
  const loadedModels = useStore((state) => state.loadedModels);
  const isOwnUserRoom = useStore((state) => state.isOwnUserRoom);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveStateRef = useRef<string>('');

  const performAutoSave = useCallback(async () => {
    // 최신 상태를 항상 가져오기
    const currentState = useStore.getState();
    const {
      loadedModels: currentLoadedModels,
      isSaving: currentIsSaving,
      isOwnUserRoom: currentIsOwnUserRoom,
      currentRoomId: currentRoomIdState
    } = currentState;
    
    // 방이 존재하고, 저장중이 아니고, 자신의 방일때만 활성화
    if (!enabled || !currentRoomIdState || currentIsSaving || !currentIsOwnUserRoom) {
      return;
    }

    // 가구의 모든 속성(position, rotation, scale 등)을 포함한 상태 비교
    const currentStateString = JSON.stringify(
      currentLoadedModels.map(model => ({
        id: model.id,
        position: model.position,
        rotation: model.rotation,
        scale: model.scale,
        url: model.url,
        texturePath: model.texturePath,
        isCityKit: model.isCityKit,
        length: model.length
      }))
    );
    
    // 상태가 변경되지 않았으면 저장하지 않음
    if (currentStateString === lastSaveStateRef.current) {
      return;
    }

    try {
      await currentState.saveSimulatorState();
      lastSaveStateRef.current = currentStateString;
    } catch (error) {
      console.error('자동저장 실패:', error);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !currentRoomId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 기존 인터벌이 있으면 먼저 정리
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 초기 상태 저장 (가구의 모든 속성 포함)
    const currentLoadedModels = useStore.getState().loadedModels;
    lastSaveStateRef.current = JSON.stringify(
      currentLoadedModels.map(model => ({
        id: model.id,
        position: model.position,
        rotation: model.rotation,
        scale: model.scale,
        url: model.url,
        texturePath: model.texturePath,
        isCityKit: model.isCityKit,
        length: model.length
      }))
    );

    // 자동저장 인터벌 설정
    intervalRef.current = setInterval(performAutoSave, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, currentRoomId, isOwnUserRoom, performAutoSave]);


  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return null; // UI 없는 컴포넌트
}