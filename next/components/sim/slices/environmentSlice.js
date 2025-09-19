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
  directionalLightIntensity: 6,

  // 카메라 상태
  cameraFov: 30, // Perspective
  // cameraZoom: 50,   // Orthographic
  // cameraMode: 'perspective', // Perspective | Orthographic
  enableWallTransparency: true,

  // 색상 관련 상태
  wallColor: "#969593",
  floorColor: "#875f32",
  backgroundColor: "#87CEEB",

  // 원본 질감 사용 여부
  useOriginalTexture: false,
  useOriginalWallTexture: false,

  ////////////////////////////////////
  // [09.15] 바닥재 텍스처 관련 상태
  // "color" | "vinyl" | "wood" | "tile"
  floorTexture: "color",
  floorTexturePresets: {
    color: { name: "단색", type: "color" },

    tile: {
      name: "타일",
      type: "texture",
      texture: "/textures/tile_01.png",
    },

    wood: {
      name: "마루",
      type: "texture",
      texture: "/textures/vintage_wood.jpg",
    },

    marble: {
      name: "대리석",
      type: "texture",
      texture: "/textures/marble_01.png",
    },
  },
  /////////////////////////////////////
  // [09.15] 벽지 텍스처 관련 상태
  // 스트라이프 , 대리석 , 패브릭
  wallTexture: "color",
  wallTexturePresets: {
    color: { name: "단색", type: "color" },

    stripe: {
      name: "스트라이프",
      type: "texture",
      texture: "/textures/wall_stripe.webp",
    },

    marble: {
      name: "대리석",
      type: "texture",
      texture: "/textures/wall_marble.jpg",
    },

    fabric: {
      name: "패브릭",
      type: "texture",
      texture: "/textures/wall_fabric_black.jpg",
    },
  },

  setEnvironmentPreset: (preset, shouldBroadcast = true) => {
    set({ environmentPreset: preset });
    if (shouldBroadcast) {
      get().collaborationCallbacks.broadcastEnvironmentPresetChange?.(preset);
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

  // texture = {key}
  setFloorTexture: (texture, shouldBroadcast = true) => {
    set({ floorTexture: texture });
    if (shouldBroadcast) {
      get().collaborationCallbacks.broadcastFloorTextureChange?.(texture);
    }
  },

  setWallTexture: (texture, shouldBroadcast = true) => {
    set({ wallTexture: texture });
    if (shouldBroadcast) {
      get().collaborationCallbacks.broadcastWallTextureChange?.(texture);
    }
  },

  setUseOriginalTexture: (use) => set({ useOriginalTexture: use }),
  setUseOriginalWallTexture: (use) => set({ useOriginalWallTexture: use }),
});
