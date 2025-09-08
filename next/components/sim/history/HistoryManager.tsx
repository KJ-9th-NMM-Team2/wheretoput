"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
} from "react";
import {
  HistoryAction,
  HistoryState,
  HistoryContextType,
  ActionType,
} from "./types";

// 컨텍스트 생성후, 타입정의 - HistoryContextType 타입만가능
const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

type HistoryActionInternal =
  | { type: "ADD_ACTION"; payload: HistoryAction }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR" };

// 히스토리 초기설정 - HistoryState 타입을 적용하는 type Annotation
const initialState: HistoryState = {
  actions: [],
  currentIndex: -1,
};

// 함수 반환 타입은 HistoryState
// state : {액션 전체 배열 actions , cur_index}
// reducer : (state,action) => (new state)
function historyReducer(
  state: HistoryState,
  action: HistoryActionInternal
): HistoryState {
  switch (action.type) {
    case "ADD_ACTION":
      // 히스토리인 actions 배열에서 0~cur_idx 까지만 복사
      const newActions = state.actions.slice(0, state.currentIndex + 1);

      // 위 배열에 새로운 action 추가
      newActions.push(action.payload);

      //추가된 새로운 HistoryState (히스토리 전체 상태) 반환
      return {
        actions: newActions,
        currentIndex: newActions.length - 1,
      };

    case "UNDO":
      return {
        ...state, //state 의 모든 내용 복사후 아래 코드로 속성 업데이트
        currentIndex: Math.max(-1, state.currentIndex - 1),
      };

    case "REDO":
      return {
        ...state, //state 의 모든 내용 복사후 아래 코드로 속성 업데이트
        currentIndex: Math.min(
          state.actions.length - 1,
          state.currentIndex + 1
        ),
      };

    case "CLEAR":
      return initialState; // 빈배열 , cur_idx = -1 초기화

    default:
      return state;
  }
}

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  // useReducer 는 두개의 값 반환
  // 1. state (history = HistoryState 객체)
  // 2. dispatch : 상태변경 요청함수
  // 첫 렌더링시 initialState
  const [history, dispatch] = useReducer(historyReducer, initialState);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 히스토리에 새로운 action 추가
  // HistoryAction 객체에서 id,timestamp 생략
  const addAction = useCallback(
    (action: Omit<HistoryAction, "id" | "timestamp">) => {
      const newAction: HistoryAction = {
        ...action,
        id: crypto.randomUUID(), //히스토리마다 "고유" id 생성
        timestamp: Date.now(), // 현재시간 추가
      };

      // 여기서 dispatch가 실행 -> historyreducer 실행
      dispatch({ type: "ADD_ACTION", payload: newAction });
    },
    []
  );

  // 현재 딜레이는 1초로 설정 ->
  const addActionDebounced = useCallback(
    (action: Omit<HistoryAction, "id" | "timestamp">, delay = 1000) => {
      // 이전에 설정된 타이머가 있는지 확인-> 있다면 초기화
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // 콜백함수 : delay(1초) 뒤에 addAction()실행
      debounceTimerRef.current = setTimeout(() => {
        addAction(action);
      }, delay);
    },
    [addAction]
  );

  const undo = useCallback(() => {
    //히스토리 배열이 존재할때만
    if (history.currentIndex >= 0) {
      const actionToUndo = history.actions[history.currentIndex];
      if (actionToUndo) {
        executeUndoAction(actionToUndo);
        dispatch({ type: "UNDO" });
      }
    }
  }, [history.currentIndex, history.actions]);

  const redo = useCallback(() => {
    if (history.currentIndex < history.actions.length - 1) {
      // 앞 action인 cur_idx +1 로 이동
      const actionToRedo = history.actions[history.currentIndex + 1];
      if (actionToRedo) {
        executeRedoAction(actionToRedo);
        dispatch({ type: "REDO" });
      }
    }
  }, [history.currentIndex, history.actions]);

  const clearHistory = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  // undo, redor 가능한지 결정
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
    <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
  );
}

// action : 하나의 액션 객체
// UNDO 실행
function executeUndoAction(action: HistoryAction) {
  // type = action.type , data  = action.data
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

// Redo 실행
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
  // useStore의 addModel 함수를 호출하기 위해 전역 이벤트 사용
  window.dispatchEvent(
    new CustomEvent("historyAddFurniture", {
      detail: { furnitureData: data.previousData },
    })
  );
}

function removeFurnitureFromScene(furnitureId: string) {
  // useStore의 removeModel 함수를 호출하기 위해 전역 이벤트 사용
  window.dispatchEvent(
    new CustomEvent("historyRemoveFurniture", {
      detail: { furnitureId },
    })
  );
}

function moveFurnitureInScene(furnitureId: string, position: any) {
  // useStore 접근을 위해 전역 이벤트 사용
  window.dispatchEvent(
    new CustomEvent("historyMoveFurniture", {
      detail: { furnitureId, position: [position.x, position.y, position.z] },
    })
  );
}

function rotateFurnitureInScene(furnitureId: string, rotation: any) {
  // useStore 접근을 위해 전역 이벤트 사용
  window.dispatchEvent(
    new CustomEvent("historyRotateFurniture", {
      detail: { furnitureId, rotation: [rotation.x, rotation.y, rotation.z] },
    })
  );
}

function scaleFurnitureInScene(furnitureId: string, scale: any) {
  // useStore 접근을 위해 전역 이벤트 사용
  window.dispatchEvent(
    new CustomEvent("historyScaleFurniture", {
      detail: {
        furnitureId,
        scale: typeof scale === "number" ? scale : scale.x,
      },
    })
  );
}

export function useHistory(): HistoryContextType {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
}
