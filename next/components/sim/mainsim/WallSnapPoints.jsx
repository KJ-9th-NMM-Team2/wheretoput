import React, { useState, useRef } from 'react';
import { useStore } from '../useStore';
import { useThree, useFrame } from '@react-three/fiber';
import { useHistory, ActionType } from '../history';

/**
 * 벽의 바닥 끝점에 스냅 포인트를 시각적으로 표시하는 컴포넌트
 */
// 미니멀한 스냅 포인트 컴포넌트
function MinimalSnapPoint({ position, pointKey, isHovered, onPointerEnter, onPointerLeave, onPointerDown }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      
      if (isHovered) {
        // 호버 시 살짝 커지는 효과
        const hoverScale = 1 + Math.sin(time * 6) * 0.1;
        meshRef.current.scale.setScalar(hoverScale * 1.1);
      } else {
        // 기본 상태
        meshRef.current.scale.setScalar(1);
      }
    }
  });
  
  return (
    <mesh
      ref={meshRef}
      position={[position[0], 0.01, position[2]]} // 바닥에서 살짝 위
      rotation={[-Math.PI / 2, 0, 0]} // 바닥 평면과 평행
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
    >
      <circleGeometry args={[0.12, 16]} />
      <meshBasicMaterial
        color={isHovered ? "#0088ff" : "#ff6b35"}
        transparent
        opacity={isHovered ? 0.8 : 0.5}
      />
    </mesh>
  );
}

export function WallSnapPoints() {
  const { wallsData, wallToolMode, setWallDrawingStart, wallDrawingStart } = useStore();
  const { raycaster, camera } = useThree();
  const { addAction } = useHistory();
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // 벽 도구 모드가 'add'일 때만 스냅 포인트 표시
  if (wallToolMode !== 'add' || !wallsData || wallsData.length === 0) {
    return null;
  }

  const snapPoints = [];

  // 각 벽의 바닥 끝점 계산
  wallsData.forEach((wall, wallIndex) => {
    const { position, rotation, dimensions } = wall;
    const halfWidth = dimensions.width / 2;
    const cos = Math.cos(rotation[1]);
    const sin = Math.sin(rotation[1]);
    
    // 벽의 바닥 양 끝점 계산 (Three.js Z축 방향 보정)
    const endpoints = [
      [
        position[0] - halfWidth * cos,
        0.1, // 바닥에서 약간 위
        position[2] + halfWidth * sin  // Z축 방향 보정
      ],
      [
        position[0] + halfWidth * cos,
        0.1, // 바닥에서 약간 위
        position[2] - halfWidth * sin  // Z축 방향 보정
      ]
    ];

    endpoints.forEach((endpoint, endpointIndex) => {
      const pointKey = `${wallIndex}-${endpointIndex}`;
      const isHovered = hoveredPoint === pointKey;
      // [09.10]벽 스냅 호버 크기 변경
      const scale = isHovered ? 1 : 0.8;
      
      snapPoints.push(
        <MinimalSnapPoint
          key={pointKey}
          position={endpoint}
          pointKey={pointKey}
          isHovered={isHovered}
          onPointerEnter={() => setHoveredPoint(pointKey)}
          onPointerLeave={() => setHoveredPoint(null)}
          onPointerDown={(e) => {
            e.stopPropagation();
            // 정확한 벽의 끝점 좌표 사용 (Y는 0으로 고정)
            const exactSnapPoint = [endpoint[0], 0, endpoint[2]];
            
            if (!wallDrawingStart) {
              // 시작점 설정
              setWallDrawingStart(exactSnapPoint);
            } else {
              // 직선 벽을 위한 좌표 정렬
              let alignedEndPoint = exactSnapPoint;
              
              // 시작점과 끝점이 다를 때만 정렬 처리
              if (wallDrawingStart[0] !== exactSnapPoint[0] || wallDrawingStart[2] !== exactSnapPoint[2]) {
                const deltaX = Math.abs(exactSnapPoint[0] - wallDrawingStart[0]);
                const deltaZ = Math.abs(exactSnapPoint[2] - wallDrawingStart[2]);
                
                // 더 긴 축을 기준으로 직선 벽 생성
                if (deltaX > deltaZ) {
                  // X축 방향 벽 (Z좌표를 시작점과 동일하게)
                  alignedEndPoint = [exactSnapPoint[0], 0, wallDrawingStart[2]];
                } else {
                  // Z축 방향 벽 (X좌표를 시작점과 동일하게)
                  alignedEndPoint = [wallDrawingStart[0], 0, exactSnapPoint[2]];
                }
              }
              
              // 끝점으로 벽 생성 - useStore의 addWall 호출
              const { addWall, wallsData } = useStore.getState();
              
              // 벽 추가 전 상태 저장 (히스토리용)
              const wallCountBefore = wallsData.length;
              addWall(wallDrawingStart, alignedEndPoint);
              
              // 벽이 실제로 추가되었는지 확인 후 히스토리 기록
              // 히스토리는 useStore.addWall에서 자동으로 처리됨
            }
          }}
        />
      );
    });
  });

  return <>{snapPoints}</>;
}