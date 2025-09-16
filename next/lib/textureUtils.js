/**
 * 텍스처 관련 유틸리티 함수들
 */

/**
 * 값이 색상인지 텍스처 키인지 판정
 * @param {string} value - 판정할 값
 * @returns {object} { isColor: boolean, isTexture: boolean }
 */
export function determineValueType(value) {
  if (!value || typeof value !== "string") {
    return { isColor: false, isTexture: false };
  }

  // '#'으로 시작하면 단색 컬러
  const isColor = value.startsWith("#");
  // '#'으로 시작하지 않으면 텍스처 키
  const isTexture = !isColor && value.length > 0;

  return { isColor, isTexture };
}

/**
 * 현재 환경 상태에서 저장용 값을 생성
 * @param {object} environmentState - 환경 상태 객체
 * @returns {object} { wallValue, floorValue }
 */
export function generateSaveValues(environmentState) {
  const {
    wallTexture,
    wallColor,
    floorTexture,
    floorColor,
    wallTexturePresets,
    floorTexturePresets,
  } = environmentState;

  // 벽: 텍스처가 color가 아니면 텍스처 키값, 아니면 색상값
  const wallValue =
    wallTexture !== "color" && wallTexturePresets[wallTexture]
      ? wallTexture
      : wallColor;

  // 바닥: 텍스처가 color가 아니면 텍스처 키값, 아니면 색상값
  const floorValue =
    floorTexture !== "color" && floorTexturePresets[floorTexture]
      ? floorTexture
      : floorColor;

  return { wallValue, floorValue };
}

/**
 * 로드된 값을 환경 상태로 변환 (하위 호환성 지원)
 * @param {string} wallValue - DB에서 로드된 벽 값
 * @param {string} floorValue - DB에서 로드된 바닥 값
 * @param {object} wallTexturePresets - 벽 텍스처 프리셋
 * @param {object} floorTexturePresets - 바닥 텍스처 프리셋
 * @returns {object} 환경 상태 업데이트 객체
 */
export function parseLoadedValues(
  wallValue,
  floorValue,
  wallTexturePresets,
  floorTexturePresets
) {
  const wallType = determineValueType(wallValue);
  const floorType = determineValueType(floorValue);

  const result = {};

  // 벽 처리 (하위 호환성 고려)
  if (wallType.isColor) {
    result.wallColor = wallValue;
    result.wallTexture = "color";
  } else if (wallType.isTexture && wallTexturePresets[wallValue]) {
    result.wallTexture = wallValue;
    result.wallColor = "#969593"; // 텍스처 사용 시 기본 색상
  } else {
    // 알 수 없는 값의 경우 - 안전하게 기본값 처리
    console.warn(
      `Unknown texture value: ${wallValue}, falling back to default`
    );
    result.wallColor = "#969593";
    result.wallTexture = "color";
  }

  // 바닥 처리 (하위 호환성 고려)
  if (floorType.isColor) {
    result.floorColor = floorValue;
    result.floorTexture = "color";
  } else if (floorType.isTexture && floorTexturePresets[floorValue]) {
    result.floorTexture = floorValue;
    result.floorColor = "#875F32"; // 텍스처 사용 시 기본 색상
  } else {
    // 알 수 없는 값의 경우 - 안전하게 기본값 처리
    console.warn(
      `Unknown texture value: ${floorValue}, falling back to default`
    );
    result.floorColor = "#875F32";
    result.floorTexture = "color";
  }

  return result;
}
