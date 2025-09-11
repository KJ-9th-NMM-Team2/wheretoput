import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PreviewBoxProps {
  position: [number, number, number];
  size: [number, number, number];
  isLoading?: boolean;
  color?: string;
}

export function PreviewBox({
  position,
  size,
  isLoading = false,
  color = "#ff6600"
}: PreviewBoxProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // 로딩 중일 때 회전 애니메이션
  useFrame((state) => {
    if (meshRef.current && isLoading) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[position[0], position[1] + Math.max(size[1] / 2, 0.5), position[2]]}
    >
      <boxGeometry args={[
        Math.max(size[0], 1), 
        Math.max(size[1], 1), 
        Math.max(size[2], 1)
      ]} />
      <meshStandardMaterial
        color={color}
        transparent={false}
        opacity={1}
        wireframe={false}
      />
    </mesh>
  );
}