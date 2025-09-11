/**
 * 2D 도면과 3D 공간 간의 좌표 및 치수 변환 유틸리티
 */

// 타입 정의
export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Array<number> {
  0: number; // x
  1: number; // y
  2: number; // z
}

export interface Wall2D {
  start: Point2D;
  end: Point2D;
}

export interface Wall3D {
  position: Point3D;
  rotation: Point3D;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  endpoints?: {
    start: Point3D;
    end: Point3D;
  };
  original2D?: Wall2D;
}

export interface WallDimensions {
  length: number;
  height: number;
  thickness: number;
  area: number;
  volume: number;
}

export interface FurnitureDimensions {
  width: number;
  height: number;
  depth: number;
  volume: number;
}

export interface SnapInfo {
  type: 'endpoint' | 'wall';
  position: Point3D;
  distance: number;
  isStart?: boolean;
  t?: number;
}

/**
 * 픽셀 좌표를 미터 단위로 변환
 * @param pixels - 픽셀 값
 * @param pixelToMmRatio - 픽셀-mm 비율 (기본값: 1000)
 * @returns 미터 단위 값
 */
export function pixelsToMeters(pixels: number, pixelToMmRatio: number = 1000): number {
  return (pixels * pixelToMmRatio) / 1000;
}

/**
 * 미터 단위를 픽셀 좌표로 변환
 * @param meters - 미터 값
 * @param pixelToMmRatio - 픽셀-mm 비율 (기본값: 1000)
 * @returns 픽셀 값
 */
export function metersToPixels(meters: number, pixelToMmRatio: number = 1000): number {
  return (meters * 1000) / pixelToMmRatio;
}

/**
 * 벽 데이터를 2D에서 3D로 변환
 * @param wall2D - 2D 벽 데이터 { start: {x, y}, end: {x, y} }
 * @param pixelToMmRatio - 픽셀-mm 비율
 * @param height - 벽 높이 (미터, 기본값: 2.5)
 * @param depth - 벽 두께 (미터, 기본값: 0.1)
 * @returns 3D 벽 데이터
 */
export function convertWall2Dto3D(wall2D: Wall2D, pixelToMmRatio: number = 1000, height: number = 2.5, depth: number = 0.1): Wall3D {
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
 * @param wall3D - 3D 벽 데이터
 * @param pixelToMmRatio - 픽셀-mm 비율
 * @returns 2D 벽 데이터
 */
export function convertWall3Dto2D(wall3D: Wall3D, pixelToMmRatio: number = 1000): Wall2D {
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
 * @param wallData - 벽 데이터
 * @returns 치수 정보
 */
export function calculateWallDimensions(wallData: Wall3D): WallDimensions {
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
 * @param scale - 스케일 배열 [x, y, z] 또는 단일 값
 * @param length - 원본 치수 배열 [x, y, z] (mm 단위) 또는 단일 값
 * @returns 치수 정보
 */
export function calculateFurnitureDimensions(scale: number | number[], length: number | number[]): FurnitureDimensions {
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
 * @param meters - 미터 단위 값
 * @param precision - 소수점 자릿수 (기본값: 2)
 * @returns 포맷된 문자열
 */
export function formatDimension(meters: number, precision: number = 2): string {
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
 * @param point1 - 첫 번째 점 [x, y, z]
 * @param point2 - 두 번째 점 [x, y, z]
 * @returns 거리 (미터)
 */
export function calculateDistance(point1: Point3D, point2: Point3D): number {
  const dx = point2[0] - point1[0];
  const dy = point2[1] - point1[1];
  const dz = point2[2] - point1[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 점이 벽 근처에 있는지 확인 (스냅핑을 위함)
 * @param point - 확인할 점 [x, y, z]
 * @param wall - 벽 데이터
 * @param tolerance - 허용 오차 (미터, 기본값: 0.5)
 * @returns 스냅 정보 또는 null
 */
export function checkWallSnap(point: Point3D, wall: Wall3D, tolerance: number = 0.5): SnapInfo | null {
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