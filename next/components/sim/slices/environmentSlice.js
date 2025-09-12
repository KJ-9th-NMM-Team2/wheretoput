import * as THREE from "three";

function sphericalToCartesian(radius, azimuth, elevation) {
  const x =
    radius *
    Math.cos(THREE.MathUtils.degToRad(elevation)) *
    Math.cos(THREE.MathUtils.degToRad(azimuth));
  const y = radius * Math.sin(THREE.MathUtils.degToRad(elevation));
  const z =
    radius *
    Math.cos(THREE.MathUtils.degToRad(elevation)) *
    Math.sin(THREE.MathUtils.degToRad(azimuth));
  return [x, y, z];
}

export const environmentSlice = (set, get) => ({
  // 빛 상태
  environmentPreset: "apartment",
  directionalLightPosition: [26, 15, 0],
  directionalLightAzimuth: 0,
  directionalLightElevation: 30,
  directionalLightIntensity: 1.0,

  // 카메라 상태
  cameraFov: 30, // Perspective
  cameraZoom: 50,   // Orthographic
  cameraMode: 'perspective', // perspective | orthographic
  enableWallTransparency: true,
  
  // 탑다운 치수 보기 모드
  topDownDimensionMode: false,
  showWallDimensions: false,
  showSelectedObjectDimensions: false,

  // 색상 관련 상태
  wallColor: "#FFFFFF",
  floorColor: "#D2B48C",
  backgroundColor: "#87CEEB",

  setEnvironmentPreset: (preset, shouldBroadcast = true) => {
    set({ environmentPreset: preset });
    if (shouldBroadcast) {
      get().collaborationCallbacks.broadcastEnvironmentPresetChange?.(
        preset
      );
    }
  },

  setDirectionalLightAzimuth: (azimuth) =>
    set({
      directionalLightAzimuth: azimuth,
      directionalLightPosition: sphericalToCartesian(
        30,
        azimuth,
        get().directionalLightElevation
      ),
    }),

  setDirectionalLightElevation: (elevation) =>
    set({
      directionalLightElevation: elevation,
      directionalLightPosition: sphericalToCartesian(
        30,
        get().directionalLightAzimuth,
        elevation
      ),
    }),

  setDirectionalLightIntensity: (intensity) =>
    set({ directionalLightIntensity: intensity }),

  setCameraFov: (fov) => set({ cameraFov: fov }),
  setCameraZoom: (zoom) => set({ cameraZoom: zoom }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setEnableWallTransparency: (enable) =>
    set({ enableWallTransparency: enable }),
    
  // 탑다운 치수 모드 관련 함수
  setTopDownDimensionMode: (enabled) => {
    const state = get();
    set({ 
      topDownDimensionMode: enabled,
      // 탑다운 모드 활성화 시 자동으로 직교 카메라와 치수 표시 활성화
      cameraMode: enabled ? 'orthographic' : 'perspective',
      showWallDimensions: enabled,
      showSelectedObjectDimensions: enabled
    });
  },
  
  setShowWallDimensions: (show) => set({ showWallDimensions: show }),
  setShowSelectedObjectDimensions: (show) => set({ showSelectedObjectDimensions: show }),

  setWallColor: (color, shouldBroadcast = true) => {
    set({ wallColor: color });
    if (shouldBroadcast) {
      get().collaborationCallbacks.broadcastWallColorChange?.(color);
    }
  },

  setFloorColor: (color, shouldBroadcast = true) => {
    set({ floorColor: color });
    if (shouldBroadcast) {
      get().collaborationCallbacks.broadcastFloorColorChange?.(color);
    }
  },

  setBackgroundColor: (color, shouldBroadcast = true) => {
    set({ backgroundColor: color });
    if (shouldBroadcast) {
      get().collaborationCallbacks.broadcastBackgroundColorChange?.(color);
    }
  },
});