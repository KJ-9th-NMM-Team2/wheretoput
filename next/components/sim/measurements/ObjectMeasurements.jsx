import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useStore } from '@/components/sim/useStore';

export function ObjectMeasurements() {
  const { loadedModels, selectedModelId, showMeasurements } = useStore();

  const objectMeasurements = useMemo(() => {
    try {
      if (!showMeasurements || !selectedModelId) return null;

      const selectedModel = loadedModels.find(model => model.id === selectedModelId);
      if (!selectedModel) return null;

      const { position, scale, length } = selectedModel;
      
      // 물체의 실제 크기 계산 (scale과 length를 고려)
      const actualScale = Array.isArray(scale) ? scale : [scale, scale, scale];
      const actualLength = Array.isArray(length) ? length : [length, length, length];
      
      // mm 단위로 변환
      const width = Math.round(actualScale[0] * actualLength[0] * 0.1);
      const height = Math.round(actualScale[1] * actualLength[1] * 0.1);
      const depth = Math.round(actualScale[2] * actualLength[2] * 0.1);

      // selection box 근처에 표시할 위치 (물체 위쪽)
      const labelPosition = [
        position[0],
        position[1] + 1.5, // 물체 위쪽
        position[2]
      ];

      return {
        position: labelPosition,
        width,
        height,
        depth
      };
    } catch (error) {
      console.error('ObjectMeasurements calculation error:', error);
      return null;
    }
  }, [loadedModels, selectedModelId, showMeasurements]);

  if (!showMeasurements || !objectMeasurements) return null;

  try {
    return (
      <group position={objectMeasurements.position}>
        <Html
          center
          transform={false}
          occlude={false}
          style={{
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg border border-green-700">
            {objectMeasurements.width} × {objectMeasurements.height} × {objectMeasurements.depth}mm
          </div>
        </Html>
      </group>
    );
  } catch (error) {
    console.error('ObjectMeasurements render error:', error);
    return null;
  }
}