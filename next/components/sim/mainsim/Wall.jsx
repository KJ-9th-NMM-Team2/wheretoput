import { useEffect, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useStore } from "@/components/sim/useStore.js";
import { useHistory, ActionType } from "@/components/sim/history";

export function Wall({
  width,
  height,
  depth = 0.1,
  position,
  rotation = [0, 0, 0],
  id,
  isMerged = false,
  originalWalls = null,
}) {
  const { invalidate } = useThree();
  const meshRef = useRef(null);
  const { camera } = useThree();
  const { enableWallTransparency, wallColor, snappedWallInfo, wallToolMode, removeWall, setSelectedWallId, selectedWallId, wallsData } = useStore();
  const { addAction } = useHistory();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    invalidate();
  }, [enableWallTransparency, invalidate]);

  useFrame(() => {
    if (!meshRef.current) return;
    if (!enableWallTransparency) {
      meshRef.current.material.opacity = 1.0;
      return;
    }

    // const wallWorldPosition = meshRef.current.getWorldPosition(new THREE.Vector3());
    const box = new THREE.Box3().setFromObject(meshRef.current);
    const closestPoint = box.clampPoint(camera.position, new THREE.Vector3());
    const distance = camera.position.distanceTo(closestPoint);

    meshRef.current.renderOrder = -distance;

    const minOpacity = 0.2;
    const maxOpacity = 0.95;
    const minDistanceThreshold = 15;
    const maxDistanceThreshold = 30;

    if (distance > maxDistanceThreshold) {
      meshRef.current.material.opacity = maxOpacity;
    } else if (distance < minDistanceThreshold) {
      meshRef.current.material.opacity = minOpacity;
    } else {
      const newOpacity =
        ((maxOpacity - minOpacity) /
          (maxDistanceThreshold - minDistanceThreshold)) *
          (distance - minDistanceThreshold) +
        minOpacity;
      meshRef.current.material.opacity = newOpacity;
    }
  });

  const handleWallClick = (event) => {
    if (event.button != 0)
      return;

    if (wallToolMode === 'delete') {
      event.stopPropagation();
      
      if (isMerged && originalWalls) {
        // 병합된 벽인 경우 원본 벽들을 모두 삭제 - removeWall에서 히스토리 관리
        originalWalls.forEach(originalWall => {
          console.log('병합된 벽의 원본 삭제:', originalWall);
          removeWall(originalWall.id, true); // shouldBroadcast를 true로 변경하여 히스토리 추가
        });
      } else {
        // 일반 벽 삭제 - removeWall에서 히스토리 관리
        removeWall(id, true); // shouldBroadcast를 true로 변경하여 히스토리 추가
      }
    } else if (wallToolMode === 'edit') {
      event.stopPropagation();
      
      if (isMerged && originalWalls) {
        // 병합된 벽인 경우 첫 번째 원본 벽을 선택
        setSelectedWallId(originalWalls[0].id);
      } else {
        setSelectedWallId(id);
      }
    }
  };

  const isSelected = selectedWallId === id;
  
  // 벽 색상 결정 로직
  let wallMaterialColor = wallColor;
  if (isSelected && wallToolMode === 'edit') {
    wallMaterialColor = '#ff6600'; // 편집 모드에서 선택된 벽
  } else if (wallToolMode === 'delete' && isHovered) {
    wallMaterialColor = '#00ff00'; // 삭제 모드에서 호버된 벽 (형광 초록색)
  }

  return (
    <mesh 
      ref={meshRef} 
      position={position} 
      rotation={rotation} 
      receiveShadow
      onPointerDown={handleWallClick}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      style={{ cursor: wallToolMode ? 'pointer' : 'default' }}
    >
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial
        color={wallMaterialColor}
        transparent
        roughness={0.8}
        metalness={0.1}
      />
      
      {/* 벽 편집 모드에서 선택된 벽 하이라이트 */}
      {isSelected && wallToolMode === 'edit' && (
        <mesh>
          <boxGeometry args={[width * 1.1, height * 1.1, depth * 1.1]} />
          <meshBasicMaterial
            color={0x00ff00} // 편집 모드에서는 초록색
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
      
      {/* 벽 삭제 모드에서 호버 효과 */}
      {wallToolMode === 'delete' && (
        <mesh>
          <boxGeometry args={[width * 1.05, height * 1.05, depth * 1.05]} />
          <meshBasicMaterial
            color={0xff0000} // 삭제 모드에서는 빨간색
            transparent
            opacity={0.2}
          />
        </mesh>
      )}

      {/* 스냅 하이라이트 - 병합된 벽과 일반 벽 모두 지원 */}
      {(() => {
        // 일반 벽인 경우: 직접 ID 매칭
        if (!isMerged) {
          return (snappedWallInfo?.wall.id === id || snappedWallInfo?.wall2?.id === id);
        }

        // 병합된 벽인 경우: 원본 벽들 중 하나라도 매칭되면 표시
        if (isMerged && originalWalls) {
          return originalWalls.some(originalWall =>
            snappedWallInfo?.wall.id === originalWall.id ||
            snappedWallInfo?.wall2?.id === originalWall.id
          );
        }

        return false;
      })() && (
        <mesh>
          <boxGeometry args={[width * 1.05, height * 1.05, depth * 1.05]} />
          <meshBasicMaterial
            color={snappedWallInfo?.isCornerSnap ? 0xff6600 : 0xffff00} // 코너 스냅시 주황색, 일반 스냅시 노란색
            transparent
            opacity={snappedWallInfo?.isCornerSnap ? 0.6 : 0.4} // 코너 스냅시 더 진하게
          />
        </mesh>
      )}
    </mesh>
  );
}
