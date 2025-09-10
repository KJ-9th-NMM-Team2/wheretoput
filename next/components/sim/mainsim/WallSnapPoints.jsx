import React, { useState, useRef } from 'react';
import { useStore } from '../useStore';
import { useThree } from '@react-three/fiber';
import { useHistory, ActionType } from '../history';

/**
 * 벽의 바닥 끝점에 스냅 포인트를 시각적으로 표시하는 컴포넌트
 */
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
        <mesh
          key={pointKey}
          position={endpoint}
          scale={[scale, scale, scale]}
          onPointerEnter={() => setHoveredPoint(pointKey)}
          onPointerLeave={() => setHoveredPoint(null)}
          onPointerDown={(e) => {
            e.stopPropagation();
            const snapPoint = [endpoint[0], 0, endpoint[2]];
            
            if (!wallDrawingStart) {
              // 시작점 설정
              setWallDrawingStart(snapPoint);
            } else {
              // 끝점으로 벽 생성 - useStore의 addWall 호출
              const { addWall, wallsData } = useStore.getState();
              
              // 벽 추가 전 상태 저장 (히스토리용)
              const wallCountBefore = wallsData.length;
              addWall(wallDrawingStart, snapPoint);
              
              // 벽이 실제로 추가되었는지 확인 후 히스토리 기록
              setTimeout(() => {
                const { wallsData: newWallsData } = useStore.getState();
                console.log('벽 추가 후 상태:', { wallCountBefore, newCount: newWallsData.length });
                if (newWallsData.length > wallCountBefore) {
                  const newWall = newWallsData[newWallsData.length - 1];
                  console.log('벽 히스토리 기록:', newWall);
                  console.log('addAction 호출 전');
                  addAction({
                    type: ActionType.WALL_ADD,
                    data: {
                      furnitureId: newWall.id, // wallId
                      previousData: newWall
                    },
                    description: `벽을 추가했습니다`
                  });
                  console.log('addAction 호출 후');
                } else {
                  console.log('벽이 추가되지 않음');
                }
              }, 0);
            }
          }}
        >
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshBasicMaterial 
            color={isHovered ? "#ff4444" : "#ff6b35"}
            transparent 
            opacity={0.9}
          />
        </mesh>
      );
    });
  });

  return <>{snapPoints}</>;
}