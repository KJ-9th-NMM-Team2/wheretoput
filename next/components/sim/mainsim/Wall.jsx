import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useStore } from "@/components/sim/useStore.js";

export function Wall({
  width,
  height,
  depth = 0.1,
  position,
  rotation = [0, 0, 0],
  id,
}) {
  const { invalidate } = useThree();
  const meshRef = useRef(null);
  const { camera } = useThree();
  const { enableWallTransparency, wallColor, snappedWallInfo, wallToolMode, removeWall, setSelectedWallId, selectedWallId } = useStore();

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
    if (wallToolMode === 'delete') {
      event.stopPropagation();
      removeWall(id);
    } else if (wallToolMode === 'edit') {
      event.stopPropagation();
      setSelectedWallId(id);
    }
  };

  const isSelected = selectedWallId === id;
  const wallMaterialColor = isSelected && wallToolMode === 'edit' ? '#ff6600' : wallColor;

  return (
    <mesh 
      ref={meshRef} 
      position={position} 
      rotation={rotation} 
      receiveShadow
      onPointerDown={handleWallClick}
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

      {(snappedWallInfo?.wall.id === id || snappedWallInfo?.wall2?.id === id) && (
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
