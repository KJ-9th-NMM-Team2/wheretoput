'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useHistory } from './HistoryManager';
import { ActionType, FurnitureData, Position, Rotation, Scale } from './types';


interface DragState {
  isDragging: boolean;
  furnitureId: string | null;
  startPosition: Position | null;
  startRotation: Rotation | null;
  startScale: Scale | null;
}

export function useHistoryDrag(debounceDelay: number = 1000) {
  const { addAction } = useHistory();
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    furnitureId: null,
    startPosition: null,
    startRotation: null,
    startScale: null,
  });
  
  // 가구별 독립적인 디바운스 타이머 관리
  const timersRef = useRef<{ [furnitureId: string]: NodeJS.Timeout }>({});
  
  // 가구별 독립적인 디바운스 히스토리 추가 함수
  const addHistoryWithDelay = useCallback((
    furnitureId: string, 
    action: Omit<any, 'id' | 'timestamp'>
  ) => {
    // 해당 가구의 기존 타이머 클리어
    if (timersRef.current[furnitureId]) {
      clearTimeout(timersRef.current[furnitureId]);
    }
    
    // 새 타이머 설정
    timersRef.current[furnitureId] = setTimeout(() => {
      addAction(action);
      delete timersRef.current[furnitureId]; // 타이머 정리
    }, debounceDelay);
  }, [addAction, debounceDelay]);

  const startDrag = useCallback((
    furnitureId: string,
    initialPosition?: Position,
    initialRotation?: Rotation,
    initialScale?: Scale
  ) => {
    dragStateRef.current = {
      isDragging: true,
      furnitureId,
      startPosition: initialPosition || null,
      startRotation: initialRotation || null,
      startScale: initialScale || null,
    };
  }, []);

  // [09.04] 사용자가 드래그를 끝냈을때, 히스토리에 기록 
  // usecallback은 [] (의존성 배열)의 값이 바뀔때만 업데이트 
  const endDragMove = useCallback((
    furnitureId: string,
    finalPosition: Position,
    description?: string
  ) => {
    const dragState = dragStateRef.current;
    
    if (dragState.isDragging && dragState.furnitureId === furnitureId) {
      if (dragState.startPosition) {
        // 변화가 있었는지 검사
        const hasChanged = (
          dragState.startPosition.x !== finalPosition.x ||
          dragState.startPosition.y !== finalPosition.y ||
          dragState.startPosition.z !== finalPosition.z
        );

        // 변화가 있었으면 
        if (hasChanged) {
          const actionData: FurnitureData = {
            furnitureId,
            position: finalPosition,
            previousData: {
              position: dragState.startPosition
            }
          };

          //액션데이터를 히스토리에 추가
          addHistoryWithDelay(furnitureId, {
            type: ActionType.FURNITURE_MOVE,
            data: actionData,
            description: description || `가구를 이동했습니다`
          });
        }
      }

      // 작업이 끝나면 드래그 상태 초기화
      dragStateRef.current = {
        isDragging: false,
        furnitureId: null,
        startPosition: null,
        startRotation: null,
        startScale: null,
      };
    }
  }, []);
//[addActionDebounced, debounceDelay]

  const endDragRotate = useCallback((
    furnitureId: string,
    finalRotation: Rotation,
    description?: string
  ) => {
    const dragState = dragStateRef.current;
    
    if (dragState.isDragging && dragState.furnitureId === furnitureId) {
      if (dragState.startRotation) {
        const hasChanged = (
          dragState.startRotation.x !== finalRotation.x ||
          dragState.startRotation.y !== finalRotation.y ||
          dragState.startRotation.z !== finalRotation.z
        );

        if (hasChanged) {
          const actionData: FurnitureData = {
            furnitureId,
            rotation: finalRotation,
            previousData: {
              rotation: dragState.startRotation
            }
          };

          addHistoryWithDelay(furnitureId, {
            type: ActionType.FURNITURE_ROTATE,
            data: actionData,
            description: description || `가구를 회전했습니다`
          });
        }
      }

      dragStateRef.current = {
        isDragging: false,
        furnitureId: null,
        startPosition: null,
        startRotation: null,
        startScale: null,
      };
    }
  }, []);
//[addActionDebounced, debounceDelay]


  const endDragScale = useCallback((
    furnitureId: string,
    finalScale: Scale,
    description?: string
  ) => {
    const dragState = dragStateRef.current;
    
    if (dragState.isDragging && dragState.furnitureId === furnitureId) {
      if (dragState.startScale) {
        const hasChanged = (
          dragState.startScale.x !== finalScale.x ||
          dragState.startScale.y !== finalScale.y ||
          dragState.startScale.z !== finalScale.z
        );

        if (hasChanged) {
          const actionData: FurnitureData = {
            furnitureId,
            scale: finalScale,
            previousData: {
              scale: dragState.startScale
            }
          };

          addHistoryWithDelay(furnitureId, {
            type: ActionType.FURNITURE_SCALE,
            data: actionData,
            description: description || `가구 크기를 변경했습니다`
          });
        }
      }

      dragStateRef.current = {
        isDragging: false,
        furnitureId: null,
        startPosition: null,
        startRotation: null,
        startScale: null,
      };
    }
  }, []);
//[addActionDebounced, debounceDelay]

  const cancelDrag = useCallback(() => {
    dragStateRef.current = {
      isDragging: false,
      furnitureId: null,
      startPosition: null,
      startRotation: null,
      startScale: null,
    };
  }, []);
  
  // 컴포넌트 언마운트 시 모든 타이머 정리
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  return {
    startDrag,
    endDragMove,
    endDragRotate,
    endDragScale,
    cancelDrag,
    isDragging: dragStateRef.current.isDragging,
  };
}