import React from 'react';
import { useStore } from '@/components/sim/useStore';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export function DimensionOverlay() {
  const { 
    topDownDimensionMode, 
    showWallDimensions, 
    showSelectedObjectDimensions,
    wallsData,
    loadedModels,
    selectedModelId 
  } = useStore();

  if (!topDownDimensionMode) {
    return null;
  }

  return (
    <>
      {/* 벽 치수 표시 */}
      {showWallDimensions && wallsData.map((wall) => (
        <WallDimensionLabel key={wall.id} wall={wall} />
      ))}
      
      {/* 선택된 가구 치수 표시 */}
      {showSelectedObjectDimensions && selectedModelId && 
        loadedModels.filter(model => model.id === selectedModelId).map((model) => (
          <FurnitureDimensionLabel key={model.id} furniture={model} />
        ))
      }
    </>
  );
}

function WallDimensionLabel({ wall }) {
  const { dimensions, position, rotation } = wall;
  
  // 벽의 중심점 계산
  const centerPosition = [position[0], position[1] + 1, position[2]];
  
  // 벽의 길이 (width가 실제 벽의 길이)
  const length = dimensions.width;
  const lengthInMm = Math.round(length * 1000); // m를 mm로 변환
  
  return (
    <Html position={centerPosition}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        transform: 'translate(-50%, -50%)',
        border: '1px solid #666',
        pointerEvents: 'none'
      }}>
        {lengthInMm}mm
      </div>
    </Html>
  );
}

function FurnitureDimensionLabel({ furniture }) {
  const { position, length } = furniture;
  
  // 가구의 상단 중앙에 치수 표시
  const labelPosition = [position[0], position[1] + length[1] + 0.5, position[2]];
  
  // 가구의 크기 (길이 x 폭 x 높이)
  const dimensions = {
    width: Math.round(length[0] * 1000), // m를 mm로 변환
    depth: Math.round(length[2] * 1000),
    height: Math.round(length[1] * 1000)
  };
  
  return (
    <Html position={labelPosition}>
      <div style={{
        background: 'rgba(74, 144, 226, 0.9)',
        color: 'white',
        padding: '6px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        transform: 'translate(-50%, -50%)',
        border: '2px solid #4A90E2',
        pointerEvents: 'none',
        textAlign: 'center'
      }}>
        <div>{furniture.name || '가구'}</div>
        <div style={{ fontSize: '10px', marginTop: '2px' }}>
          {dimensions.width}×{dimensions.depth}×{dimensions.height}mm
        </div>
      </div>
    </Html>
  );
}