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
  // cameraZoom: 50,   // Orthographic
  // cameraMode: 'perspective', // Perspective | Orthographic
  enableWallTransparency: true,

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
  // setCameraMode: (mode) => set({ cameraMode: mode }),
  setEnableWallTransparency: (enable) =>
    set({ enableWallTransparency: enable }),

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