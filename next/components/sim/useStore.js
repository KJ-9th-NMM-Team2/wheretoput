import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import * as THREE from "three";
import { previewSlice } from "./slices/previewSlice";
import { collaborationSlice } from "./slices/collaborationSlice";
import { modelSlice } from "./slices/modelSlice";
import { wallSlice } from "./slices/wallSlice";
import { environmentSlice } from "./slices/environmentSlice";
import { stackingSlice } from "./slices/stackingSlice";
import { roomSlice } from "./slices/roomSlice";
import { uiSlice } from "./slices/uiSlice";

//Zustand 라이브러리에서 create 제공
export const useStore = create(
  subscribeWithSelector((set, get) => {
    // 히스토리 이벤트 리스너 설정
    if (typeof window !== "undefined") {
      window.addEventListener("historyAddFurniture", (event) => {
        const { furnitureData } = event.detail;
        get().addModelWithId(furnitureData);
      });

      window.addEventListener("historyRemoveFurniture", (event) => {
        const { furnitureId } = event.detail;
        get().removeModel(furnitureId);
      });

      window.addEventListener("historyMoveFurniture", (event) => {
        const { furnitureId, position } = event.detail;
        get().updateModelPosition(furnitureId, position);
      });

      window.addEventListener("historyRotateFurniture", (event) => {
        const { furnitureId, rotation } = event.detail;
        get().updateModelRotation(furnitureId, rotation);
      });

      window.addEventListener("historyScaleFurniture", (event) => {
        const { furnitureId, scale } = event.detail;
        get().updateModelScale(furnitureId, scale);
      });

      window.addEventListener("historyAddWall", (event) => {
        const { wallData } = event.detail;
        // console.log('useStore: 벽 추가 이벤트 수신', wallData);
        get().addWallWithId(wallData);
      });

      window.addEventListener("historyRemoveWall", (event) => {
        const { wallId } = event.detail;
        get().removeWall(wallId, true, false);
      });
    }

    return {
      ...previewSlice(set, get),
      ...collaborationSlice(set, get),
      ...modelSlice(set, get),
      ...wallSlice(set, get),
      ...environmentSlice(set, get),
      ...stackingSlice(set, get),
      ...roomSlice(set, get),
      ...uiSlice(set, get),
    };
  })
);