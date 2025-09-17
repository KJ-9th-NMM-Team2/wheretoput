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
    Math.pow(point2[0] - point1[0], 2) + Math.pow(point2[2] - point1[2], 2)
  );
};

/**
 * 벽의 회전각 계산
 * @param {Array} startPoint - 시작점 [x, y, z]
 * @param {Array} endPoint - 끝점 [x, y, z]
 * @returns {number} Y축 회전각 (라디안)
 */
export const calculateWallRotation = (startPoint, endPoint) => {
  return Math.atan2(endPoint[2] - startPoint[2], endPoint[0] - startPoint[0]);
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
    depth >= 0.01 // 최소 깊이
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
        position[2] + halfWidth * sin, // sin 부호 변경
      ],
      end: [
        position[0] + halfWidth * cos,
        position[2] - halfWidth * sin, // sin 부호 변경
      ],
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
    -(
      (line1.start[0] - line1.end[0]) * (line1.start[1] - line2.start[1]) -
      (line1.start[1] - line1.end[1]) * (line1.start[0] - line2.start[0])
    ) / denominator;

  // 교차점 계산 (선분 범위 확장)
  const intersection = [
    line1.start[0] + t * (line1.end[0] - line1.start[0]),
    line1.start[1] + t * (line1.end[1] - line1.start[1]),
  ];

  //console.log(`📊 교차 계산 결과: t=${t}, u=${u}`, intersection);

  // 조건을 더 완화: 벽의 연장선상에서도 교차 허용
  const tolerance = 0.5;
  if (
    t >= -tolerance &&
    t <= 1 + tolerance &&
    u >= -tolerance &&
    u <= 1 + tolerance
  ) {
    //console.log("✅ 교차점 발견!", intersection);
    return intersection;
  }

  //console.log("❌ 교차점 범위 밖");
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
      x:
        wall.position[0] -
        (wall.dimensions.width / 2) * Math.cos(wall.rotation[1]),
      y:
        wall.position[2] -
        (wall.dimensions.width / 2) * Math.sin(wall.rotation[1]),
    },
    end: {
      x:
        wall.position[0] +
        (wall.dimensions.width / 2) * Math.cos(wall.rotation[1]),
      y:
        wall.position[2] +
        (wall.dimensions.width / 2) * Math.sin(wall.rotation[1]),
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
      width: wall.length,
      height: 2.5,
      depth: 0.15,
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
export const snapToWallEndpoints = (
  point,
  existingWalls,
  snapDistance = 0.5
) => {
  if (!existingWalls || existingWalls.length === 0) return null;

  let closestPoint = null;
  let minDistance = snapDistance;

  existingWalls.forEach((wall) => {
    const { position, rotation, dimensions } = wall;
    const halfWidth = dimensions.width / 2;
    const cos = Math.cos(rotation[1]);
    const sin = Math.sin(rotation[1]);

    // 벽의 양 끝점 계산
    const endpoints = [
      [
        position[0] - halfWidth * cos,
        position[1],
        position[2] + halfWidth * sin, // sin 부호 변경
      ],
      [
        position[0] + halfWidth * cos,
        position[1],
        position[2] - halfWidth * sin, // sin 부호 변경
      ],
    ];

    endpoints.forEach((endpoint) => {
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
export const snapWallToWalls = (
  startPoint,
  endPoint,
  existingWalls,
  snapDistance = 0.5
) => {
  const snappedStart =
    snapToWallEndpoints(startPoint, existingWalls, snapDistance) || startPoint;
  const snappedEnd =
    snapToWallEndpoints(endPoint, existingWalls, snapDistance) || endPoint;

  return { snappedStart, snappedEnd };
};

/**
 * 클릭한 포인트가 스냅 포인트 근처인지 확인하고 자동으로 스냅
 * @param {Array} clickPoint - 클릭한 점 [x, y, z]
 * @param {Array} existingWalls - 기존 벽 배열
 * @param {number} snapDistance - 스냅 거리 (기본값: 1.0)
 * @returns {Array} 스냅된 점 또는 원래 점 [x, y, z]
 */
export const autoSnapToNearestWallEndpoint = (
  clickPoint,
  existingWalls,
  snapDistance = 0.3
) => {
  if (!existingWalls || existingWalls.length === 0) return clickPoint;

  let closestPoint = null;
  let minDistance = snapDistance;

  existingWalls.forEach((wall) => {
    const { position, rotation, dimensions } = wall;
    const halfWidth = dimensions.width / 2;
    const cos = Math.cos(rotation[1]);
    const sin = Math.sin(rotation[1]);

    // 벽의 양 끝점 계산
    const endpoints = [
      [
        position[0] - halfWidth * cos,
        0, // Y좌표는 항상 0으로
        position[2] + halfWidth * sin, // sin 부호 변경
      ],
      [
        position[0] + halfWidth * cos,
        0, // Y좌표는 항상 0으로
        position[2] - halfWidth * sin, // sin 부호 변경
      ],
    ];

    endpoints.forEach((endpoint) => {
      const distance = calculate2DDistance(clickPoint, endpoint);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = endpoint;
      }
    });
  });

  return closestPoint || clickPoint;
};

/**
 * 벽의 시작점과 끝점을 계산
 * @param {Object} wall - 벽 객체
 * @returns {Object} { start: [x, z], end: [x, z] }
 */
export const getWallEndpoints = (wall) => {
  const { position, rotation, dimensions } = wall;
  const halfWidth = dimensions.width / 2;
  const cos = Math.cos(rotation[1]);
  const sin = Math.sin(rotation[1]);

  // wallSlice.js의 rotationY = Math.atan2(-dz, dx) 로직과 일치하도록 수정
  return {
    start: [
      position[0] - halfWidth * cos,
      position[2] + halfWidth * sin, // sin 부호 변경
    ],
    end: [
      position[0] + halfWidth * cos,
      position[2] - halfWidth * sin, // sin 부호 변경
    ],
  };
};

/**
 * 두 벽이 일직선상에 있고 연결되어 있는지 확인
 * @param {Object} wall1 - 첫 번째 벽
 * @param {Object} wall2 - 두 번째 벽
 * @param {number} tolerance - 허용 오차 (기본값: 0.1)
 * @returns {boolean} 연결 여부
 */
export const areWallsConnectedInLine = (wall1, wall2, tolerance = 0.1) => {
  // 같은 각도인지 확인 (평행한지)
  const angle1 = wall1.rotation[1];
  const angle2 = wall2.rotation[1];
  const angleDiff = Math.abs(angle1 - angle2);
  const isParallel =
    angleDiff < tolerance || Math.abs(angleDiff - Math.PI) < tolerance;

  if (!isParallel) return false;

  const endpoints1 = getWallEndpoints(wall1);
  const endpoints2 = getWallEndpoints(wall2);

  // 벽의 끝점들이 연결되어 있는지 확인
  const connections = [
    calculate2DDistance(
      [endpoints1.start[0], 0, endpoints1.start[1]],
      [endpoints2.start[0], 0, endpoints2.start[1]]
    ),
    calculate2DDistance(
      [endpoints1.start[0], 0, endpoints1.start[1]],
      [endpoints2.end[0], 0, endpoints2.end[1]]
    ),
    calculate2DDistance(
      [endpoints1.end[0], 0, endpoints1.end[1]],
      [endpoints2.start[0], 0, endpoints2.start[1]]
    ),
    calculate2DDistance(
      [endpoints1.end[0], 0, endpoints1.end[1]],
      [endpoints2.end[0], 0, endpoints2.end[1]]
    ),
  ];

  return connections.some((distance) => distance < tolerance);
};

/**
 * 연결된 벽들을 그룹으로 찾기
 * @param {Array} walls - 벽 배열
 * @returns {Array} 연결된 벽 그룹들의 배열
 */
export const findConnectedWallGroups = (walls) => {
  if (!walls || walls.length === 0) return [];

  const visited = new Set();
  const groups = [];

  const findConnectedWalls = (startWall, currentGroup) => {
    if (visited.has(startWall.id)) return;

    visited.add(startWall.id);
    currentGroup.push(startWall);

    // 다른 벽들과 연결 확인
    walls.forEach((wall) => {
      if (!visited.has(wall.id) && areWallsConnectedInLine(startWall, wall)) {
        findConnectedWalls(wall, currentGroup);
      }
    });
  };

  walls.forEach((wall) => {
    if (!visited.has(wall.id)) {
      const group = [];
      findConnectedWalls(wall, group);

      // 2개 이상의 벽이 연결된 경우만 그룹으로 처리
      if (group.length > 1) {
        groups.push(group);
      }
    }
  });

  return groups;
};

/**
 * 연결된 벽 그룹을 하나의 병합된 벽으로 계산
 * @param {Array} wallGroup - 연결된 벽들의 배열
 * @returns {Object} 병합된 벽 정보
 */
export const mergeWallGroup = (wallGroup) => {
  if (!wallGroup || wallGroup.length === 0) return null;
  if (wallGroup.length === 1) return wallGroup[0];

  // 모든 벽의 끝점들을 수집
  const allEndpoints = [];
  wallGroup.forEach((wall) => {
    const endpoints = getWallEndpoints(wall);
    allEndpoints.push([endpoints.start[0], endpoints.start[1]]);
    allEndpoints.push([endpoints.end[0], endpoints.end[1]]);
  });

  // 가장 멀리 떨어진 두 점 찾기 (병합된 벽의 시작점과 끝점)
  let maxDistance = 0;
  let mergedStart = null;
  let mergedEnd = null;

  for (let i = 0; i < allEndpoints.length; i++) {
    for (let j = i + 1; j < allEndpoints.length; j++) {
      const distance = calculate2DDistance(
        [allEndpoints[i][0], 0, allEndpoints[i][1]],
        [allEndpoints[j][0], 0, allEndpoints[j][1]]
      );
      if (distance > maxDistance) {
        maxDistance = distance;
        mergedStart = allEndpoints[i];
        mergedEnd = allEndpoints[j];
      }
    }
  }

  // 병합된 벽의 중점과 회전 계산
  const centerX = (mergedStart[0] + mergedEnd[0]) / 2;
  const centerZ = (mergedStart[1] + mergedEnd[1]) / 2;
  const rotation = Math.atan2(
    mergedEnd[1] - mergedStart[1],
    mergedEnd[0] - mergedStart[0]
  );

  // 첫 번째 벽의 속성을 기본으로 사용
  const firstWall = wallGroup[0];

  return {
    id: `merged_${wallGroup.map((w) => w.id).join("_")}_${Date.now()}`,
    position: [centerX, firstWall.position[1], centerZ],
    rotation: [0, rotation, 0],
    dimensions: {
      width: maxDistance,
      height: firstWall.dimensions.height,
      depth: firstWall.dimensions.depth,
    },
    originalWalls: wallGroup, // 원본 벽들 참조
  };
};

/**
 * 벽 데이터를 기반으로 방의 중앙 계산
 * @param {Array} wallsData - 벽 데이터 배열
 * @returns {Array} 방의 중앙 좌표 [x, y, z]
 */
export const calculateRoomCenter = (wallsData) => {
  if (!wallsData || wallsData.length === 0) {
    return [0, 0, 0]; // 기본 방의 중앙
  }

  // 벽들의 2D 좌표를 추출하여 경계 상자 계산
  const wallLines = wallsData.map((wall) => {
    const { position, rotation, dimensions } = wall;
    const length = dimensions.width;
    const angle = rotation[1]; // Y축 회전각

    // 벽의 시작점과 끝점 계산
    const halfLength = length / 2;
    const startX = position[0] - Math.cos(angle) * halfLength;
    const startZ = position[2] - Math.sin(angle) * halfLength;
    const endX = position[0] + Math.cos(angle) * halfLength;
    const endZ = position[2] + Math.sin(angle) * halfLength;

    return { startX, startZ, endX, endZ };
  });

  // 경계 상자 계산
  const allX = [
    ...wallLines.map((w) => w.startX),
    ...wallLines.map((w) => w.endX),
  ];
  const allZ = [
    ...wallLines.map((w) => w.startZ),
    ...wallLines.map((w) => w.endZ),
  ];
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minZ = Math.min(...allZ);
  const maxZ = Math.max(...allZ);

  // 방의 중앙 좌표 계산
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  return [centerX, 0, centerZ];
};

/**
 * 방 로드 시 카메라 초기 위치 계산
 * @param {Array} wallsData - 벽 데이터 배열
 * @returns {Array} 카메라 초기 위치 [x, y, z]
 */
export const getInitialCameraPosition = (wallsData) => {
  const roomCenter = calculateRoomCenter(wallsData);

  const [centerX, , centerZ] = roomCenter;

  // 방의 중앙 위쪽으로 카메라 위치 설정
  const cameraPosition = [centerX, 20, centerZ + 20];

  return cameraPosition;
};
