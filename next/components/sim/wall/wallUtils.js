/**
 * 벽 관련 유틸리티 함수들
 */

/**
 * 두 점 사이의 거리 계산
 * @param {Array} point1 - 첫 번째 점 [x, y, z]
 * @param {Array} point2 - 두 번째 점 [x, y, z]
 * @returns {number} 거리
 */
export const calculateDistance = (point1, point2) => {
  return Math.sqrt(
    Math.pow(point2[0] - point1[0], 2) + 
    Math.pow(point2[1] - point1[1], 2) + 
    Math.pow(point2[2] - point1[2], 2)
  );
};

/**
 * 두 점 사이의 2D 거리 계산 (Y축 제외)
 * @param {Array} point1 - 첫 번째 점 [x, y, z]
 * @param {Array} point2 - 두 번째 점 [x, y, z]
 * @returns {number} 2D 거리
 */
export const calculate2DDistance = (point1, point2) => {
  return Math.sqrt(
    Math.pow(point2[0] - point1[0], 2) + 
    Math.pow(point2[2] - point1[2], 2)
  );
};

/**
 * 벽의 회전각 계산
 * @param {Array} startPoint - 시작점 [x, y, z]
 * @param {Array} endPoint - 끝점 [x, y, z]
 * @returns {number} Y축 회전각 (라디안)
 */
export const calculateWallRotation = (startPoint, endPoint) => {
  return Math.atan2(
    endPoint[2] - startPoint[2], 
    endPoint[0] - startPoint[0]
  );
};

/**
 * 벽의 중점 계산
 * @param {Array} startPoint - 시작점 [x, y, z]
 * @param {Array} endPoint - 끝점 [x, y, z]
 * @returns {Array} 중점 [x, y, z]
 */
export const calculateWallCenter = (startPoint, endPoint) => {
  return [
    (startPoint[0] + endPoint[0]) / 2,
    (startPoint[1] + endPoint[1]) / 2,
    (startPoint[2] + endPoint[2]) / 2,
  ];
};

/**
 * 격자에 스냅하는 함수
 * @param {Array} point - 스냅할 점 [x, y, z]
 * @param {number} gridSize - 격자 크기 (기본값: 0.5)
 * @returns {Array} 스냅된 점 [x, y, z]
 */
export const snapToGrid = (point, gridSize = 0.5) => {
  return [
    Math.round(point[0] / gridSize) * gridSize,
    point[1], // Y축은 스냅하지 않음
    Math.round(point[2] / gridSize) * gridSize,
  ];
};

/**
 * 벽이 유효한지 검사
 * @param {Object} wall - 검사할 벽 객체
 * @returns {boolean} 유효 여부
 */
export const isValidWall = (wall) => {
  if (!wall || !wall.position || !wall.dimensions) {
    return false;
  }

  const { width, height, depth } = wall.dimensions;
  
  return (
    width > 0 && 
    height > 0 && 
    depth > 0 &&
    width >= 0.1 && // 최소 너비
    height >= 0.1 && // 최소 높이
    depth >= 0.01   // 최소 깊이
  );
};

/**
 * 벽들 간의 교차점 찾기
 * @param {Object} wall1 - 첫 번째 벽
 * @param {Object} wall2 - 두 번째 벽
 * @returns {Array|null} 교차점 [x, z] 또는 null
 */
export const findWallIntersection = (wall1, wall2) => {
  // 벽의 시작점과 끝점 계산
  const getWallEndpoints = (wall) => {
    const { position, rotation, dimensions } = wall;
    const halfWidth = dimensions.width / 2;
    const cos = Math.cos(rotation[1]);
    const sin = Math.sin(rotation[1]);
    
    return {
      start: [
        position[0] - halfWidth * cos,
        position[2] - halfWidth * sin
      ],
      end: [
        position[0] + halfWidth * cos,
        position[2] + halfWidth * sin
      ]
    };
  };

  const line1 = getWallEndpoints(wall1);
  const line2 = getWallEndpoints(wall2);

  // 선분 교차 알고리즘
  const denominator = 
    (line1.start[0] - line1.end[0]) * (line2.start[1] - line2.end[1]) -
    (line1.start[1] - line1.end[1]) * (line2.start[0] - line2.end[0]);

  if (Math.abs(denominator) < 1e-10) {
    return null; // 평행선
  }

  const t = 
    ((line1.start[0] - line2.start[0]) * (line2.start[1] - line2.end[1]) -
     (line1.start[1] - line2.start[1]) * (line2.start[0] - line2.end[0])) / 
    denominator;

  const u = 
    -((line1.start[0] - line1.end[0]) * (line1.start[1] - line2.start[1]) -
      (line1.start[1] - line1.end[1]) * (line1.start[0] - line2.start[0])) / 
    denominator;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return [
      line1.start[0] + t * (line1.end[0] - line1.start[0]),
      line1.start[1] + t * (line1.end[1] - line1.start[1])
    ];
  }

  return null; // 교차점 없음
};

/**
 * 벽 데이터를 DB 형식으로 변환
 * @param {Array} wallsData - 벽 데이터 배열
 * @param {number} scaleFactor - 스케일 팩터
 * @returns {Array} DB 형식의 벽 데이터
 */
export const convertWallsToDBFormat = (wallsData, scaleFactor = 1.0) => {
  return wallsData.map((wall) => ({
    start: {
      x: wall.position[0] - (wall.dimensions.width / 2) * Math.cos(wall.rotation[1]),
      y: wall.position[2] - (wall.dimensions.width / 2) * Math.sin(wall.rotation[1])
    },
    end: {
      x: wall.position[0] + (wall.dimensions.width / 2) * Math.cos(wall.rotation[1]),
      y: wall.position[2] + (wall.dimensions.width / 2) * Math.sin(wall.rotation[1])
    },
    length: wall.dimensions.width / scaleFactor,
    height: wall.dimensions.height / scaleFactor,
  }));
};

/**
 * DB 형식의 벽 데이터를 시뮬레이터 형식으로 변환
 * @param {Array} dbWalls - DB 형식의 벽 데이터
 * @param {number} scaleFactor - 스케일 팩터
 * @returns {Array} 시뮬레이터 형식의 벽 데이터
 */
export const convertDBWallsToSimulator = (dbWalls, scaleFactor = 1.0) => {
  return dbWalls.map((wall, index) => ({
    id: wall.id || `wall_${index}`,
    dimensions: {
      width: wall.length * scaleFactor,
      height: wall.height * scaleFactor,
      depth: 0.2 * scaleFactor,
    },
    position: [
      (wall.start.x + wall.end.x) / 2,
      (wall.height * scaleFactor) / 2,
      (wall.start.y + wall.end.y) / 2,
    ],
    rotation: [
      0,
      Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x),
      0,
    ],
  }));
};

/**
 * 벽 끝점에서 가장 가까운 기존 벽의 끝점을 찾아 스냅
 * @param {Array} point - 스냅할 점 [x, y, z]
 * @param {Array} existingWalls - 기존 벽 배열
 * @param {number} snapDistance - 스냅 거리 (기본값: 0.5)
 * @returns {Array|null} 스냅된 점 [x, y, z] 또는 null
 */
export const snapToWallEndpoints = (point, existingWalls, snapDistance = 0.5) => {
  if (!existingWalls || existingWalls.length === 0) return null;

  let closestPoint = null;
  let minDistance = snapDistance;

  existingWalls.forEach(wall => {
    const { position, rotation, dimensions } = wall;
    const halfWidth = dimensions.width / 2;
    const cos = Math.cos(rotation[1]);
    const sin = Math.sin(rotation[1]);
    
    // 벽의 양 끝점 계산
    const endpoints = [
      [
        position[0] - halfWidth * cos,
        position[1],
        position[2] - halfWidth * sin
      ],
      [
        position[0] + halfWidth * cos,
        position[1],
        position[2] + halfWidth * sin
      ]
    ];

    endpoints.forEach(endpoint => {
      const distance = calculate2DDistance(point, endpoint);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = endpoint;
      }
    });
  });

  return closestPoint;
};

/**
 * 벽이 기존 벽과 연결되는지 확인하고 스냅된 끝점 반환
 * @param {Array} startPoint - 시작점 [x, y, z]
 * @param {Array} endPoint - 끝점 [x, y, z]
 * @param {Array} existingWalls - 기존 벽 배열
 * @param {number} snapDistance - 스냅 거리
 * @returns {Object} { snappedStart, snappedEnd }
 */
export const snapWallToWalls = (startPoint, endPoint, existingWalls, snapDistance = 0.5) => {
  const snappedStart = snapToWallEndpoints(startPoint, existingWalls, snapDistance) || startPoint;
  const snappedEnd = snapToWallEndpoints(endPoint, existingWalls, snapDistance) || endPoint;
  
  return { snappedStart, snappedEnd };
};