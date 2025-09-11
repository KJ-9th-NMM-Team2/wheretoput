/**
 * 2D 도면과 3D 공간 간의 좌표 및 치수 변환 유틸리티
 */

/**
 * 픽셀 좌표를 미터 단위로 변환
 * @param {number} pixels - 픽셀 값
 * @param {number} pixelToMmRatio - 픽셀-mm 비율 (기본값: 1000)
 * @returns {number} 미터 단위 값
 */
export function pixelsToMeters(pixels, pixelToMmRatio = 1000) {
  return (pixels * pixelToMmRatio) / 1000;
}

/**
 * 미터 단위를 픽셀 좌표로 변환
 * @param {number} meters - 미터 값
 * @param {number} pixelToMmRatio - 픽셀-mm 비율 (기본값: 1000)
 * @returns {number} 픽셀 값
 */
export function metersToPixels(meters, pixelToMmRatio = 1000) {
  return (meters * 1000) / pixelToMmRatio;
}

/**
 * 벽 데이터를 2D에서 3D로 변환
 * @param {Object} wall2D - 2D 벽 데이터 { start: {x, y}, end: {x, y} }
 * @param {number} pixelToMmRatio - 픽셀-mm 비율
 * @param {number} height - 벽 높이 (미터, 기본값: 2.5)
 * @param {number} depth - 벽 두께 (미터, 기본값: 0.1)
 * @returns {Object} 3D 벽 데이터
 */
export function convertWall2Dto3D(wall2D, pixelToMmRatio = 1000, height = 2.5, depth = 0.1) {
  // 시작점과 끝점을 미터 단위로 변환
  const startX = pixelsToMeters(wall2D.start.x, pixelToMmRatio);
  const startZ = pixelsToMeters(wall2D.start.y, pixelToMmRatio);
  const endX = pixelsToMeters(wall2D.end.x, pixelToMmRatio);
  const endZ = pixelsToMeters(wall2D.end.y, pixelToMmRatio);

  // 벽의 길이와 중심점 계산
  const length = Math.sqrt(
    Math.pow(endX - startX, 2) + Math.pow(endZ - startZ, 2)
  );
  const centerX = (startX + endX) / 2;
  const centerZ = (startZ + endZ) / 2;
  const centerY = height / 2; // 벽의 중심 높이

  // 회전각 계산 (Z축 기준)
  const rotationY = Math.atan2(endZ - startZ, endX - startX);

  return {
    position: [centerX, centerY, centerZ],
    rotation: [0, rotationY, 0],
    dimensions: {
      width: length,
      height: height,
      depth: depth,
    },
    endpoints: {
      start: [startX, 0, startZ],
      end: [endX, 0, endZ],
    },
    original2D: wall2D,
  };
}

/**
 * 3D 벽 데이터를 2D로 변환
 * @param {Object} wall3D - 3D 벽 데이터
 * @param {number} pixelToMmRatio - 픽셀-mm 비율
 * @returns {Object} 2D 벽 데이터
 */
export function convertWall3Dto2D(wall3D, pixelToMmRatio = 1000) {
  const { position, rotation, dimensions } = wall3D;
  const halfLength = dimensions.width / 2;
  const angle = rotation[1]; // Y축 회전각

  // 시작점과 끝점 계산
  const startX = position[0] - Math.cos(angle) * halfLength;
  const startZ = position[2] - Math.sin(angle) * halfLength;
  const endX = position[0] + Math.cos(angle) * halfLength;
  const endZ = position[2] + Math.sin(angle) * halfLength;

  return {
    start: {
      x: metersToPixels(startX, pixelToMmRatio),
      y: metersToPixels(startZ, pixelToMmRatio),
    },
    end: {
      x: metersToPixels(endX, pixelToMmRatio),
      y: metersToPixels(endZ, pixelToMmRatio),
    },
  };
}

/**
 * 벽의 실제 치수 정보를 계산
 * @param {Object} wallData - 벽 데이터
 * @returns {Object} 치수 정보
 */
export function calculateWallDimensions(wallData) {
  const { dimensions, endpoints } = wallData;
  
  // 실제 길이 계산 (끝점 좌표 기준)
  let actualLength = dimensions.width;
  if (endpoints) {
    const [startX, , startZ] = endpoints.start;
    const [endX, , endZ] = endpoints.end;
    actualLength = Math.sqrt(
      Math.pow(endX - startX, 2) + Math.pow(endZ - startZ, 2)
    );
  }

  return {
    length: actualLength,
    height: dimensions.height,
    thickness: dimensions.depth,
    area: actualLength * dimensions.height,
    volume: actualLength * dimensions.height * dimensions.depth,
  };
}

/**
 * 가구의 실제 치수 정보를 계산
 * @param {Array} scale - 스케일 배열 [x, y, z]
 * @param {Array} length - 원본 치수 배열 [x, y, z] (mm 단위)
 * @returns {Object} 치수 정보
 */
export function calculateFurnitureDimensions(scale, length) {
  const actualScale = Array.isArray(scale) ? scale : [scale, scale, scale];
  const actualLength = Array.isArray(length) ? length : [length, length, length];
  
  // mm를 m로 변환하고 스케일 적용
  const dimensions = {
    width: (actualLength[0] * actualScale[0]) / 1000,
    height: (actualLength[1] * actualScale[1]) / 1000,
    depth: (actualLength[2] * actualScale[2]) / 1000,
  };

  return {
    ...dimensions,
    volume: dimensions.width * dimensions.height * dimensions.depth,
  };
}

/**
 * 치수 값을 적절한 단위로 포맷팅
 * @param {number} meters - 미터 단위 값
 * @param {number} precision - 소수점 자릿수 (기본값: 2)
 * @returns {string} 포맷된 문자열
 */
export function formatDimension(meters, precision = 2) {
  if (meters < 0.01) {
    return `${(meters * 1000).toFixed(0)}mm`;
  } else if (meters < 1) {
    return `${(meters * 100).toFixed(1)}cm`;
  } else {
    return `${meters.toFixed(precision)}m`;
  }
}

/**
 * 두 점 사이의 거리 계산
 * @param {Array} point1 - 첫 번째 점 [x, y, z]
 * @param {Array} point2 - 두 번째 점 [x, y, z]
 * @returns {number} 거리 (미터)
 */
export function calculateDistance(point1, point2) {
  const dx = point2[0] - point1[0];
  const dy = point2[1] - point1[1];
  const dz = point2[2] - point1[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 점이 벽 근처에 있는지 확인 (스냅핑을 위함)
 * @param {Array} point - 확인할 점 [x, y, z]
 * @param {Object} wall - 벽 데이터
 * @param {number} tolerance - 허용 오차 (미터, 기본값: 0.5)
 * @returns {Object|null} 스냅 정보 또는 null
 */
export function checkWallSnap(point, wall, tolerance = 0.5) {
  if (!wall.endpoints) return null;

  const [pointX, , pointZ] = point;
  const [startX, , startZ] = wall.endpoints.start;
  const [endX, , endZ] = wall.endpoints.end;

  // 시작점 거리 확인
  const distToStart = Math.sqrt(
    Math.pow(pointX - startX, 2) + Math.pow(pointZ - startZ, 2)
  );
  if (distToStart <= tolerance) {
    return {
      type: 'endpoint',
      position: [startX, 0, startZ],
      distance: distToStart,
      isStart: true,
    };
  }

  // 끝점 거리 확인
  const distToEnd = Math.sqrt(
    Math.pow(pointX - endX, 2) + Math.pow(pointZ - endZ, 2)
  );
  if (distToEnd <= tolerance) {
    return {
      type: 'endpoint',
      position: [endX, 0, endZ],
      distance: distToEnd,
      isStart: false,
    };
  }

  // 벽의 중간점 거리 확인
  const wallLength = Math.sqrt(
    Math.pow(endX - startX, 2) + Math.pow(endZ - startZ, 2)
  );
  
  // 점에서 벽까지의 수직 거리 계산
  const t = Math.max(0, Math.min(1, 
    ((pointX - startX) * (endX - startX) + (pointZ - startZ) * (endZ - startZ)) / 
    (wallLength * wallLength)
  ));
  
  const closestX = startX + t * (endX - startX);
  const closestZ = startZ + t * (endZ - startZ);
  const distToWall = Math.sqrt(
    Math.pow(pointX - closestX, 2) + Math.pow(pointZ - closestZ, 2)
  );
  
  if (distToWall <= tolerance) {
    return {
      type: 'wall',
      position: [closestX, 0, closestZ],
      distance: distToWall,
      t: t, // 벽 위의 상대적 위치 (0-1)
    };
  }

  return null;
}