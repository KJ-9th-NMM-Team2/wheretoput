
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
    
    console.log('자동저장 체크:', {
      enabled,
      currentRoomId,
      isSaving,
      isOwnUserRoom,
      modelsCount: loadedModels.length
    });
    
    // 방 소유권 체크가 안 되어 있다면 디버그 정보 출력
    if (!currentRoomId) {
      console.log('currentRoomId가 null입니다. SimulatorCore에서 setCurrentRoomId가 호출되었는지 확인하세요');
    }
    if (!isOwnUserRoom) {
      console.log('방 소유권 확인 필요 - checkUserRoom 함수가 호출되었는지 확인하세요');
      console.log('현재 currentRoomId:', currentRoomId);
    }
    
    // 방이 존재하고, 저장중이 아니고, 자신의 방일때만 활성화
    if (!enabled || !currentRoomId || isSaving || !isOwnUserRoom) {
      console.log('자동저장 조건 미충족으로 건너뜀');
      return;
    }

    // 현재 상태를 문자열로 변환하여 이전 상태와 비교
    const currentStateString = JSON.stringify(loadedModels);
    
    // 상태가 변경되지 않았으면 저장하지 않음
    if (currentStateString === lastSaveStateRef.current) {
      console.log('자동저장: 상태 변경 없어서 건너뜀');
      return;
    }
    
    console.log('자동저장 시작...');

    try {
      await saveSimulatorState();
      lastSaveStateRef.current = currentStateString;
      console.log('자동저장 완료:', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('자동저장 실패:', error);
    }
  }, [enabled, currentRoomId, isSaving, loadedModels, saveSimulatorState, isOwnUserRoom]);

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

    // 초기 상태 저장
    lastSaveStateRef.current = JSON.stringify(loadedModels);

    // 자동저장 인터벌 설정
    console.log(`자동저장 인터벌 시작: ${interval}ms (roomId: ${currentRoomId}, isOwnUserRoom: ${isOwnUserRoom})`);
    intervalRef.current = setInterval(performAutoSave, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, currentRoomId, isOwnUserRoom]);

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