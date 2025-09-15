import React, { useMemo } from 'react';
import { Wall } from './Wall.jsx';
import { findConnectedWallGroups, mergeWallGroup } from '@/components/sim/wall/wallUtils.js';

/**
 * 연결된 벽들을 자동으로 감지하고 시각적으로 병합하여 렌더링하는 컴포넌트
 * DB는 그대로 두고 시뮬레이터에서만 하나의 벽으로 보이게 함
 */
export function MergedWalls({ wallsData }) {
  const { mergedWalls, standaloneWalls } = useMemo(() => {
    if (!wallsData || wallsData.length === 0) {
      return { mergedWalls: [], standaloneWalls: [] };
    }

    // 연결된 벽 그룹들 찾기
    const connectedGroups = findConnectedWallGroups(wallsData);
    
    // 그룹에 속하지 않은 독립적인 벽들 찾기
    const groupedWallIds = new Set();
    connectedGroups.forEach(group => {
      group.forEach(wall => groupedWallIds.add(wall.id));
    });
    
    const standalone = wallsData.filter(wall => !groupedWallIds.has(wall.id));
    
    // 각 그룹을 병합된 벽으로 변환
    const merged = connectedGroups.map(group => mergeWallGroup(group)).filter(Boolean);
    
    return {
      mergedWalls: merged,
      standaloneWalls: standalone
    };
  }, [wallsData]);

  return (
    <>
      {/* 병합된 벽들 렌더링 */}
      {mergedWalls.map((mergedWall) => (
        <Wall
          key={mergedWall.id}
          width={Math.max(mergedWall.dimensions.width, 0.5)}
          height={Math.max(mergedWall.dimensions.height, 2.5)}
          depth={Math.max(mergedWall.dimensions.depth, 0.2)}
          position={mergedWall.position}
          rotation={mergedWall.rotation}
          id={mergedWall.id}
          isMerged={true}
          originalWalls={mergedWall.originalWalls}
        />
      ))}
      
      {/* 독립적인 벽들 렌더링 */}
      {standaloneWalls.map((wall) => (
        <Wall
          key={wall.id}
          width={Math.max(wall.dimensions.width, 0.5)}
          height={Math.max(wall.dimensions.height, 2.5)}
          depth={Math.max(wall.dimensions.depth, 0.2)}
          position={wall.position}
          rotation={wall.rotation}
          id={wall.id}
        />
      ))}
    </>
  );
}