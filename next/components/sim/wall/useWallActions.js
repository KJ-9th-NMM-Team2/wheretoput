/**
 * 벽 관련 액션들을 관리하는 훅
 * 벽 추가, 삭제, 편집 등의 로직을 담당합니다.
 */

import { 
  calculate2DDistance, 
  calculateWallRotation, 
  calculateWallCenter,
  snapToGrid,
  isValidWall 
} from './wallUtils';

export const createWallActions = (set, get) => ({
  // ===== 벽 도구 모드 관련 액션 =====
  
  /**
   * 벽 도구 모드 설정
   * @param {string|null} mode - 'add', 'edit', 'delete', null
   */
  setWallToolMode: (mode) => 
    set({ 
      wallToolMode: mode, 
      wallDrawingStart: null, 
      selectedWallId: null 
    }),

  /**
   * 벽 그리기 시작점 설정
   * @param {Array} point - [x, y, z] 좌표
   */
  setWallDrawingStart: (point) => 
    set({ wallDrawingStart: point }),

  /**
   * 선택된 벽 ID 설정
   * @param {string|null} wallId - 벽 ID
   */
  setSelectedWallId: (wallId) => 
    set({ selectedWallId: wallId }),

  // ===== 벽 CRUD 액션 =====
  
  /**
   * 새로운 벽 추가
   * @param {Array} startPoint - 시작점 [x, y, z]
   * @param {Array} endPoint - 끝점 [x, y, z]
   */
  addWall: (startPoint, endPoint) => set((state) => {
    // 격자 스냅 적용
    const snappedStart = state.wallGridSnap ? snapToGrid(startPoint) : startPoint;
    const snappedEnd = state.wallGridSnap ? snapToGrid(endPoint) : endPoint;
    
    // 최소 벽 길이 체크
    const distance = calculate2DDistance(snappedStart, snappedEnd);
    
    if (distance < state.minWallLength) {
      console.warn(`벽이 너무 짧습니다. 최소 ${state.minWallLength}m 이상이어야 합니다.`);
      return state; // 상태 변경 없음
    }

    if (distance > state.maxWallLength) {
      console.warn(`벽이 너무 깁니다. 최대 ${state.maxWallLength}m 이하여야 합니다.`);
      return state; // 상태 변경 없음
    }

    // 벽 중점 계산
    const centerPoint = calculateWallCenter(snappedStart, snappedEnd);
    
    const newWall = {
      id: crypto.randomUUID(),
      position: [
        centerPoint[0],
        state.wallsData[0]?.position[1] || state.defaultWallHeight / 2, // 기존 벽 높이나 기본값
        centerPoint[2]
      ],
      rotation: [
        0, 
        calculateWallRotation(snappedStart, snappedEnd),
        0
      ],
      dimensions: {
        width: distance,
        height: state.wallsData[0]?.dimensions?.height || state.defaultWallHeight, // 기존 벽 높이 사용
        depth: state.wallsData[0]?.dimensions?.depth || state.defaultWallDepth // 기존 벽 두께 사용
      }
    };
    
    // 벽 유효성 검사
    if (!isValidWall(newWall)) {
      console.error('유효하지 않은 벽 데이터:', newWall);
      return state;
    }
    
    console.log('새 벽 추가:', newWall);
    
    return {
      wallsData: [...state.wallsData, newWall],
      wallDrawingStart: null, // 벽 추가 후 시작점 초기화
    };
  }),

  /**
   * 벽 삭제
   * @param {string} wallId - 삭제할 벽의 ID
   */
  removeWall: (wallId) => set((state) => {
    const wallToRemove = state.wallsData.find(wall => wall.id === wallId);
    if (wallToRemove) {
      console.log('벽 삭제:', wallToRemove);
    }
    
    return {
      wallsData: state.wallsData.filter(wall => wall.id !== wallId),
      selectedWallId: null,
    };
  }),

  /**
   * 벽 속성 업데이트
   * @param {string} wallId - 업데이트할 벽의 ID
   * @param {Object} updates - 업데이트할 속성들
   */
  updateWall: (wallId, updates) => set((state) => {
    console.log('벽 업데이트:', wallId, updates);
    
    return {
      wallsData: state.wallsData.map(wall => 
        wall.id === wallId ? { ...wall, ...updates } : wall
      ),
    };
  }),

  /**
   * 벽 위치 이동
   * @param {string} wallId - 이동할 벽의 ID
   * @param {Array} newPosition - 새로운 위치 [x, y, z]
   */
  moveWall: (wallId, newPosition) => set((state) => {
    return {
      wallsData: state.wallsData.map(wall => 
        wall.id === wallId 
          ? { ...wall, position: newPosition }
          : wall
      ),
    };
  }),

  /**
   * 벽 크기 조정
   * @param {string} wallId - 크기를 조정할 벽의 ID
   * @param {Object} newDimensions - 새로운 크기 { width?, height?, depth? }
   */
  resizeWall: (wallId, newDimensions) => set((state) => {
    return {
      wallsData: state.wallsData.map(wall => 
        wall.id === wallId 
          ? { 
              ...wall, 
              dimensions: { ...wall.dimensions, ...newDimensions }
            }
          : wall
      ),
    };
  }),

  /**
   * 벽 회전
   * @param {string} wallId - 회전할 벽의 ID  
   * @param {Array} newRotation - 새로운 회전값 [x, y, z]
   */
  rotateWall: (wallId, newRotation) => set((state) => {
    return {
      wallsData: state.wallsData.map(wall => 
        wall.id === wallId 
          ? { ...wall, rotation: newRotation }
          : wall
      ),
    };
  }),

  /**
   * 모든 벽 삭제
   */
  clearAllWalls: () => set({
    wallsData: [],
    selectedWallId: null,
    wallDrawingStart: null,
    wallToolMode: null,
  }),

  /**
   * 벽 복사
   * @param {string} wallId - 복사할 벽의 ID
   * @param {Array} offset - 복사본의 위치 오프셋 [x, y, z]
   */
  duplicateWall: (wallId, offset = [2, 0, 0]) => set((state) => {
    const originalWall = state.wallsData.find(wall => wall.id === wallId);
    if (!originalWall) return state;

    const duplicatedWall = {
      ...originalWall,
      id: crypto.randomUUID(),
      position: [
        originalWall.position[0] + offset[0],
        originalWall.position[1] + offset[1],
        originalWall.position[2] + offset[2],
      ]
    };

    return {
      wallsData: [...state.wallsData, duplicatedWall],
    };
  }),
});