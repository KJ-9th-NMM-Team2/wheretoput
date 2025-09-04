'use client';

import { useRef, useCallback } from 'react';
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
  const { addActionDebounced } = useHistory();
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    furnitureId: null,
    startPosition: null,
    startRotation: null,
    startScale: null,
  });

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

  const endDragMove = useCallback((
    furnitureId: string,
    finalPosition: Position,
    description?: string
  ) => {
    const dragState = dragStateRef.current;
    
    if (dragState.isDragging && dragState.furnitureId === furnitureId) {
      if (dragState.startPosition) {
        const hasChanged = (
          dragState.startPosition.x !== finalPosition.x ||
          dragState.startPosition.y !== finalPosition.y ||
          dragState.startPosition.z !== finalPosition.z
        );

        if (hasChanged) {
          const actionData: FurnitureData = {
            furnitureId,
            position: finalPosition,
            previousData: {
              position: dragState.startPosition
            }
          };

          addActionDebounced({
            type: ActionType.FURNITURE_MOVE,
            data: actionData,
            description: description || `가구를 이동했습니다`
          }, debounceDelay);
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
  }, [addActionDebounced, debounceDelay]);

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

          addActionDebounced({
            type: ActionType.FURNITURE_ROTATE,
            data: actionData,
            description: description || `가구를 회전했습니다`
          }, debounceDelay);
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
  }, [addActionDebounced, debounceDelay]);

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

          addActionDebounced({
            type: ActionType.FURNITURE_SCALE,
            data: actionData,
            description: description || `가구 크기를 변경했습니다`
          }, debounceDelay);
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
  }, [addActionDebounced, debounceDelay]);

  const cancelDrag = useCallback(() => {
    dragStateRef.current = {
      isDragging: false,
      furnitureId: null,
      startPosition: null,
      startRotation: null,
      startScale: null,
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