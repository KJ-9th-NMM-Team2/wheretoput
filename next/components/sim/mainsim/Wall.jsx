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
}) {
  const { invalidate } = useThree();
  const meshRef = useRef(null);
  const { camera } = useThree();
  const { enableWallTransparency, wallColor } = useStore();

  useEffect(() => {
    invalidate();
  }, [enableWallTransparency, invalidate]);

  useFrame(() => {
    if (!meshRef.current) return;
    if (!enableWallTransparency) {
      meshRef.current.material.opacity = 1.0;
      return;
    }

    const wallWorldPosition = new THREE.Vector3();
    meshRef.current.getWorldPosition(wallWorldPosition);
    const distance = camera.position.distanceTo(wallWorldPosition);

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

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial
        color={wallColor}
        transparent
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}