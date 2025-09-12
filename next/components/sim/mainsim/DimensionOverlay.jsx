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
  
  // 벽의 중심점 계산 (탑다운 뷰에서 보기 좋게 약간 위로)
  const centerPosition = [position[0], position[1] + 2, position[2]];
  
  // 벽의 길이 (width가 실제 벽의 길이)
  const length = dimensions.width;
  const lengthInMm = Math.round(length * 1000); // m를 mm로 변환
  
  // 길이에 따라 다른 포맷 사용
  const displayLength = lengthInMm >= 1000 
    ? `${(lengthInMm / 1000).toFixed(1)}m`
    : `${lengthInMm}mm`;
  
  return (
    <Html position={centerPosition}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '6px 10px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        transform: 'translate(-50%, -50%)',
        border: '2px solid #FFA500',
        pointerEvents: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        fontFamily: 'monospace'
      }}>
        {displayLength}
      </div>
    </Html>
  );
}

function FurnitureDimensionLabel({ furniture }) {
  const { position, length, name } = furniture;
  
  // 가구의 상단 중앙에 치수 표시 (조금 더 높게)
  const labelPosition = [position[0], position[1] + length[1] + 1, position[2]];
  
  // 가구의 크기 (길이 x 폭 x 높이)
  const dimensions = {
    width: Math.round(length[0] * 1000), // m를 mm로 변환
    depth: Math.round(length[2] * 1000),
    height: Math.round(length[1] * 1000)
  };
  
  // 더 읽기 쉬운 포맷으로 표시
  const formatDimension = (mm) => mm >= 1000 ? `${(mm/1000).toFixed(1)}m` : `${mm}mm`;
  
  return (
    <Html position={labelPosition}>
      <div style={{
        background: 'rgba(74, 144, 226, 0.95)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        transform: 'translate(-50%, -50%)',
        border: '2px solid #4A90E2',
        pointerEvents: 'none',
        textAlign: 'center',
        boxShadow: '0 3px 12px rgba(74, 144, 226, 0.3)',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ fontSize: '13px', marginBottom: '3px' }}>
          {name || '가구'}
        </div>
        <div style={{ 
          fontSize: '11px', 
          fontFamily: 'monospace',
          opacity: 0.9 
        }}>
          {formatDimension(dimensions.width)} × {formatDimension(dimensions.depth)} × {formatDimension(dimensions.height)}
        </div>
      </div>
    </Html>
  );
}