/**
 * 벽 관련 상태의 초기값들을 정의합니다.
 */

export const initialWallState = {
  // ===== 벽 데이터 =====
  wallsData: [],
  wallScaleFactor: 1.0, // 벽 크기 조정 팩터

  // ===== 벽 도구 모드 관리 =====
  wallToolMode: null, // 'add', 'edit', 'delete', null
  wallDrawingStart: null, // 벽 그리기 시작점 [x, y, z]
  selectedWallId: null, // 선택된 벽 ID

  // ===== 벽 편집 관련 =====
  wallEditMode: 'move', // 'move', 'resize', 'rotate'
  wallSnapEnabled: true, // 벽 스냅 기능 활성화
  wallGridSnap: true, // 격자에 스냅
  wallSnapDistance: 1.0, // 스냅 거리

  // ===== 벽 설정 =====
  defaultWallHeight: 5.0, // 기본 벽 높이
  defaultWallDepth: 0.2, // 기본 벽 두께
  minWallLength: 0.5, // 최소 벽 길이
  maxWallLength: 50.0, // 최대 벽 길이
};