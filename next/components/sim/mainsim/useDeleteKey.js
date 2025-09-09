import { useEffect } from 'react';
import { ActionType } from '@/components/sim/history';

export function useDeleteKey(selectedModel, addAction, removeModel, deselectModel) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedModel) {
        // 히스토리에 삭제 액션 기록 (삭제 전에 현재 상태 저장)
        addAction({
          type: ActionType.FURNITURE_REMOVE,
          data: {
            furnitureId: selectedModel.id,
            previousData: {
              id: selectedModel.id,
              name: selectedModel.name,
              url: selectedModel.url,
              position: selectedModel.position,
              rotation: selectedModel.rotation,
              scale: selectedModel.scale,
              length: selectedModel.length,
              furniture_id: selectedModel.furniture_id,
              isCityKit: selectedModel.isCityKit,
              texturePath: selectedModel.texturePath,
              type: selectedModel.type,
              furnitureName: selectedModel.furnitureName,
              categoryId: selectedModel.categoryId,
              object_id: selectedModel.object_id
            }
          },
          description: `가구 "${selectedModel.name || selectedModel.furnitureName || 'Unknown'}"를 삭제했습니다`
        });
        
        // 실제 가구 삭제
        removeModel(selectedModel.id);
        deselectModel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedModel, addAction, removeModel, deselectModel]);
}