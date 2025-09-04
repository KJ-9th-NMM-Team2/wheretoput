'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { HistoryAction, HistoryState, HistoryContextType, ActionType } from './types';

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

type HistoryActionInternal = 
  | { type: 'ADD_ACTION'; payload: HistoryAction }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR' };

const initialState: HistoryState = {
  actions: [],
  currentIndex: -1,
};

function historyReducer(state: HistoryState, action: HistoryActionInternal): HistoryState {
  switch (action.type) {
    case 'ADD_ACTION':
      const newActions = state.actions.slice(0, state.currentIndex + 1);
      newActions.push(action.payload);
      return {
        actions: newActions,
        currentIndex: newActions.length - 1,
      };
    
    case 'UNDO':
      return {
        ...state,
        currentIndex: Math.max(-1, state.currentIndex - 1),
      };
    
    case 'REDO':
      return {
        ...state,
        currentIndex: Math.min(state.actions.length - 1, state.currentIndex + 1),
      };
    
    case 'CLEAR':
      return initialState;
    
    default:
      return state;
  }
}

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, dispatch] = useReducer(historyReducer, initialState);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const addAction = useCallback((action: Omit<HistoryAction, 'id' | 'timestamp'>) => {
    const newAction: HistoryAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_ACTION', payload: newAction });
  }, []);

  const addActionDebounced = useCallback((action: Omit<HistoryAction, 'id' | 'timestamp'>, delay = 1000) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      addAction(action);
    }, delay);
  }, [addAction]);

  const undo = useCallback(() => {
    if (history.currentIndex >= 0) {
      const actionToUndo = history.actions[history.currentIndex];
      if (actionToUndo) {
        executeUndoAction(actionToUndo);
        dispatch({ type: 'UNDO' });
      }
    }
  }, [history.currentIndex, history.actions]);

  const redo = useCallback(() => {
    if (history.currentIndex < history.actions.length - 1) {
      const actionToRedo = history.actions[history.currentIndex + 1];
      if (actionToRedo) {
        executeRedoAction(actionToRedo);
        dispatch({ type: 'REDO' });
      }
    }
  }, [history.currentIndex, history.actions]);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const canUndo = history.currentIndex >= 0;
  const canRedo = history.currentIndex < history.actions.length - 1;

  const value: HistoryContextType = {
    addAction,
    addActionDebounced,
    undo,
    redo,
    canUndo,
    canRedo,
    history,
    clearHistory,
  };

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
}

function executeUndoAction(action: HistoryAction) {
  const { type, data } = action;

  switch (type) {
    case ActionType.FURNITURE_ADD:
      removeFurnitureFromScene(data.furnitureId);
      break;
    
    case ActionType.FURNITURE_REMOVE:
      addFurnitureToScene(data);
      break;
    
    case ActionType.FURNITURE_MOVE:
      if (data.previousData?.position) {
        moveFurnitureInScene(data.furnitureId, data.previousData.position);
      }
      break;
    
    case ActionType.FURNITURE_ROTATE:
      if (data.previousData?.rotation) {
        rotateFurnitureInScene(data.furnitureId, data.previousData.rotation);
      }
      break;
    
    case ActionType.FURNITURE_SCALE:
      if (data.previousData?.scale) {
        scaleFurnitureInScene(data.furnitureId, data.previousData.scale);
      }
      break;
  }
}

function executeRedoAction(action: HistoryAction) {
  const { type, data } = action;

  switch (type) {
    case ActionType.FURNITURE_ADD:
      addFurnitureToScene(data);
      break;
    
    case ActionType.FURNITURE_REMOVE:
      removeFurnitureFromScene(data.furnitureId);
      break;
    
    case ActionType.FURNITURE_MOVE:
      if (data.position) {
        moveFurnitureInScene(data.furnitureId, data.position);
      }
      break;
    
    case ActionType.FURNITURE_ROTATE:
      if (data.rotation) {
        rotateFurnitureInScene(data.furnitureId, data.rotation);
      }
      break;
    
    case ActionType.FURNITURE_SCALE:
      if (data.scale) {
        scaleFurnitureInScene(data.furnitureId, data.scale);
      }
      break;
  }
}

function addFurnitureToScene(data: any) {
  console.log('Adding furniture to scene:', data);
  // TODO: 실제 3D 씬에 가구 추가 로직 구현
}

function removeFurnitureFromScene(furnitureId: string) {
  console.log('Removing furniture from scene:', furnitureId);
  // TODO: 실제 3D 씬에서 가구 제거 로직 구현
}

function moveFurnitureInScene(furnitureId: string, position: any) {
  console.log('Moving furniture in scene:', furnitureId, position);
  
  // useStore 접근을 위해 전역 이벤트 사용
  window.dispatchEvent(new CustomEvent('historyMoveFurniture', {
    detail: { furnitureId, position: [position.x, position.y, position.z] }
  }));
}

function rotateFurnitureInScene(furnitureId: string, rotation: any) {
  console.log('Rotating furniture in scene:', furnitureId, rotation);
  
  // useStore 접근을 위해 전역 이벤트 사용
  window.dispatchEvent(new CustomEvent('historyRotateFurniture', {
    detail: { furnitureId, rotation: [rotation.x, rotation.y, rotation.z] }
  }));
}

function scaleFurnitureInScene(furnitureId: string, scale: any) {
  console.log('Scaling furniture in scene:', furnitureId, scale);
  
  // useStore 접근을 위해 전역 이벤트 사용
  window.dispatchEvent(new CustomEvent('historyScaleFurniture', {
    detail: { furnitureId, scale: typeof scale === 'number' ? scale : scale.x }
  }));
}

export function useHistory(): HistoryContextType {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}