// 히스토리에 저장할 액션타입 (가구 추가/삭제/이동/회전/크기조정, 벽 추가/삭제)
export enum ActionType {
  FURNITURE_ADD = 'FURNITURE_ADD',
  FURNITURE_REMOVE = 'FURNITURE_REMOVE',
  FURNITURE_MOVE = 'FURNITURE_MOVE',
  FURNITURE_ROTATE = 'FURNITURE_ROTATE',
  FURNITURE_SCALE = 'FURNITURE_SCALE',
  WALL_ADD = 'WALL_ADD',
  WALL_REMOVE = 'WALL_REMOVE',
}

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Rotation {
  x: number;
  y: number;
  z: number;
}

export interface Scale {
  x: number;
  y: number;
  z: number;
}

export interface FurnitureData {
  furnitureId: string;
  position?: Position;
  rotation?: Rotation;
  scale?: Scale;
  previousData?: any;
}

//히스토리 하나를 나타내는 객체
export interface HistoryAction {
  id: string;
  type: ActionType;
  data: FurnitureData;
  description: string;
  timestamp: number;
}

//히스토리 전체 상태 
// actions : 액션 전체 배열
// cur_index : undo/redo 에서 현재 위치
export interface HistoryState {
  actions: HistoryAction[];
  currentIndex: number;
}

export interface HistoryContextType {
  addAction: (action: Omit<HistoryAction, 'id' | 'timestamp'>) => void;
  addActionDebounced: (action: Omit<HistoryAction, 'id' | 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  history: HistoryState;
  clearHistory: () => void;
}