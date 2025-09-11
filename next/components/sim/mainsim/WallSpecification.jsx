import React, { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "@/components/sim/useStore.js";
import { formatDimension } from "@/utils/dimensionUtils";

/**
 * 벽의 규격 정보를 3D 공간에 표시하는 컴포넌트
 */
export function WallSpecification({
  position,
  rotation = [0, 0, 0], 
  dimensions,
  wallId,
  isVisible = true,
}) {
  const textRef = useRef();
  const { camera } = useThree();
  const { showSpecifications } = useStore();

  // 벽의 길이를 적절한 단위로 표시
  const lengthText = formatDimension(dimensions.width || 0);
  const heightText = `H: ${formatDimension(dimensions.height || 2.5)}`;
  const thicknessText = `T: ${formatDimension(dimensions.depth || 0.1)}`;

  // 텍스트가 항상 카메라를 향하도록 회전 계산
  useEffect(() => {
    if (textRef.current && camera) {
      textRef.current.lookAt(camera.position);
    }
  });

  if (!showSpecifications || !isVisible) {
    return null;
  }

  // 벽의 중앙점에서 약간 위쪽에 텍스트 배치
  const textPosition = [
    position[0],
    position[1] + (dimensions.height || 2.5) / 2 + 0.5, // 벽 높이의 중앙보다 약간 위
    position[2]
  ];

  return (
    <group position={textPosition}>
      {/* 메인 길이 표시 */}
      <Text
        ref={textRef}
        position={[0, 0.3, 0]}
        fontSize={0.3}
        color="#333333"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        outlineWidth={0.02}
        outlineColor="#ffffff"
      >
        {lengthText}
      </Text>
      
      {/* 높이 정보 (작은 글씨로) */}
      <Text
        position={[0, 0, 0]}
        fontSize={0.2}
        color="#666666"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#ffffff"
      >
        {heightText}
      </Text>

      {/* 두께 정보 (더 작은 글씨로) */}
      <Text
        position={[0, -0.25, 0]}
        fontSize={0.15}
        color="#999999"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#ffffff"
      >
        {thicknessText}
      </Text>

      {/* 배경 평면 (가독성 향상) */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2, 1.2]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/**
 * 벽 끝점에 좌표 정보를 표시하는 컴포넌트
 */
export function WallEndpointMarker({ position, isStart = true, isVisible = true }) {
  const { showSpecifications } = useStore();

  if (!showSpecifications || !isVisible) {
    return null;
  }

  const coordinateText = `(${position[0].toFixed(1)}, ${position[2].toFixed(1)})`;
  const markerColor = isStart ? "#00ff00" : "#ff0000"; // 시작점: 초록, 끝점: 빨강

  return (
    <group position={position}>
      {/* 좌표 마커 */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshBasicMaterial color={markerColor} />
      </mesh>
      
      {/* 좌표 텍스트 */}
      <Text
        position={[0, 0.3, 0]}
        fontSize={0.15}
        color="#333333"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#ffffff"
      >
        {coordinateText}
      </Text>
    </group>
  );
}