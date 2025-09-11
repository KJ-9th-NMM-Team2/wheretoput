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
  color = "#ff6600",
}: PreviewBoxProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  console.log("preview box size: ", size);

  return (
    <mesh
      ref={meshRef}
      position={[
        position[0],
        position[1] + Math.max(size[1] / 2, 0.5),
        position[2],
      ]}
    >
      <boxGeometry
        args={[
          Math.max(size[0], 0.001),
          Math.max(size[1], 0.001),
          Math.max(size[2], 0.001),
        ]}
      />
      <meshStandardMaterial
        color={color}
        transparent={false}
        opacity={1}
        wireframe={false}
      />
    </mesh>
  );
}
