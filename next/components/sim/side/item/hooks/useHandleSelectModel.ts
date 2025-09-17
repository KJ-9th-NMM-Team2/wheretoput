import { useHandleSelectModelType } from "@/types/sideItems";
import { furnitures as Furniture } from "@prisma/client";
import { useCallback } from "react";

export const useHandleSelectModel = ({
    loadedModels, selectModel
}: useHandleSelectModelType) => {
    const handleSelectModel = useCallback(
        (item: Furniture) => {
            // loadedModels에서 해당 furniture_id를 가진 모델 찾기
            const modelToSelect = loadedModels.find(
                (model) => model.furniture_id === item.furniture_id
            );

            if (modelToSelect) {
                selectModel(modelToSelect.id);
            }
        },
        [loadedModels, selectModel]
    );
    return handleSelectModel;
}

// // 가구 선택 핸들러 (배치한 가구목록에서 카드 클릭 시)
  // const handleSelectModel = useCallback(
  //   (item: Furniture) => {
  //     // loadedModels에서 해당 furniture_id를 가진 모델 찾기
  //     const modelToSelect = loadedModels.find(
  //       (model) => model.furniture_id === item.furniture_id
  //     );

  //     if (modelToSelect) {
  //       selectModel(modelToSelect.id);
  //     }
  //   },
  //   [loadedModels, selectModel]
  // );