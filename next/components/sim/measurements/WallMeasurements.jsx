import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useStore } from '@/components/sim/useStore';

export function WallMeasurements() {
  const { wallsData, showMeasurements } = useStore();

  const wallMeasurements = useMemo(() => {
    try {
      if (!showMeasurements || !wallsData || !Array.isArray(wallsData) || wallsData.length === 0) {
        return [];
      }

      return wallsData.map((wall) => {
        if (!wall || !wall.id || !wall.position || !wall.dimensions) {
          return null;
        }

        const { id, position, dimensions } = wall;
        const length = dimensions.width || 0;
        
        // 길이를 mm 단위로 변환
        const lengthInMm = Math.round(length * 100);

        // 벽의 방향에 따른 텍스트 위치 계산 (벽 중앙, 바닥에서 약간 위)
        const textPosition = [
          position[0] || 0,
          0.3, // 바닥에서 약간 위
          position[2] || 0
        ];

        return {
          id,
          position: textPosition,
          length: lengthInMm
        };
      }).filter(Boolean);
    } catch (error) {
      console.error('WallMeasurements calculation error:', error);
      return [];
    }
  }, [wallsData, showMeasurements]);

  if (!showMeasurements || wallMeasurements.length === 0) {
    return null;
  }

  try {
    return (
      <>
        {wallMeasurements.map((measurement) => (
          <group key={measurement.id} position={measurement.position}>
            <Html
              center
              transform={false}
              occlude={false}
              style={{
                pointerEvents: 'none',
                userSelect: 'none'
              }}
            >
              <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg border border-blue-700">
                {measurement.length}mm
              </div>
            </Html>
          </group>
        ))}
      </>
    );
  } catch (error) {
    console.error('WallMeasurements render error:', error);
    return null;
  }
}