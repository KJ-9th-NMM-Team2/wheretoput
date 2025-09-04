export enum ActionType {
  FURNITURE_ADD = 'FURNITURE_ADD',
  FURNITURE_REMOVE = 'FURNITURE_REMOVE',
  FURNITURE_MOVE = 'FURNITURE_MOVE',
  FURNITURE_ROTATE = 'FURNITURE_ROTATE',
  FURNITURE_SCALE = 'FURNITURE_SCALE',
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

export interface HistoryAction {
  id: string;
  type: ActionType;
  data: FurnitureData;
  description: string;
  timestamp: number;
}

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