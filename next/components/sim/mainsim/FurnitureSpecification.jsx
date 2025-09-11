import React, { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "@/components/sim/useStore.js";
import { formatDimension, calculateFurnitureDimensions } from "@/utils/dimensionUtils";

/**
 * 가구의 규격 정보를 3D 공간에 표시하는 컴포넌트
 */
export function FurnitureSpecification({
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  length = [1, 1, 1], // [width, height, depth] in mm
  modelId,
  isVisible = true,
  name = "가구",
}) {
  const textRef = useRef();
  const { camera } = useThree();
  const { showSpecifications, selectedModelId } = useStore();

  // 실제 치수 계산
  const dimensions = calculateFurnitureDimensions(scale, length);
  const dimensionText = `${formatDimension(dimensions.width)}×${formatDimension(dimensions.height)}×${formatDimension(dimensions.depth)}`;
  const volumeText = `부피: ${(dimensions.volume).toFixed(3)}㎥`;
  
  const isSelected = selectedModelId === modelId;

  // 텍스트가 항상 카메라를 향하도록 회전 계산
  useEffect(() => {
    if (textRef.current && camera) {
      textRef.current.lookAt(camera.position);
    }
  });

  if (!showSpecifications || !isVisible) {
    return null;
  }

  // 가구 위쪽에 텍스트 배치
  const textPosition = [
    position[0],
    position[1] + dimensions.height + 0.5,
    position[2]
  ];

  return (
    <group position={textPosition}>
      {/* 가구 이름 */}
      <Text
        ref={textRef}
        position={[0, 0.4, 0]}
        fontSize={0.25}
        color={isSelected ? "#ff6600" : "#333333"}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        outlineWidth={0.02}
        outlineColor="#ffffff"
      >
        {name}
      </Text>
      
      {/* 규격 정보 */}
      <Text
        position={[0, 0.1, 0]}
        fontSize={0.2}
        color="#666666"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#ffffff"
      >
        {dimensionText}
      </Text>

      {/* 부피 정보 (선택된 가구만) */}
      {isSelected && (
        <Text
          position={[0, -0.2, 0]}
          fontSize={0.15}
          color="#999999"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#ffffff"
        >
          {volumeText}
        </Text>
      )}

      {/* 위치 정보 (선택된 가구만) */}
      {isSelected && (
        <Text
          position={[0, -0.4, 0]}
          fontSize={0.15}
          color="#999999"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#ffffff"
        >
          {`(${position[0].toFixed(1)}, ${position[1].toFixed(1)}, ${position[2].toFixed(1)})`}
        </Text>
      )}

      {/* 배경 평면 (가독성 향상) */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[3.5, isSelected ? 1.6 : 1]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={isSelected ? 0.9 : 0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 선택된 가구의 경계 상자 표시 */}
      {isSelected && (
        <mesh position={[0, -dimensions.height - 0.5, 0]}>
          <boxGeometry args={[
            dimensions.width + 0.1,
            dimensions.height + 0.1,
            dimensions.depth + 0.1
          ]} />
          <meshBasicMaterial 
            color="#ff6600" 
            transparent 
            opacity={0.2}
            wireframe={true}
          />
        </mesh>
      )}
    </group>
  );
}

/**
 * 가구의 치수 선을 표시하는 컴포넌트
 */
export function FurnitureDimensionLines({
  position,
  scale = [1, 1, 1],
  length = [1, 1, 1],
  modelId,
  isVisible = true,
}) {
  const { showSpecifications, selectedModelId } = useStore();

  if (!showSpecifications || !isVisible || selectedModelId !== modelId) {
    return null;
  }

  // 실제 치수 계산
  const dimensions = calculateFurnitureDimensions(scale, length);
  const halfWidth = dimensions.width / 2;
  const halfDepth = dimensions.depth / 2;

  return (
    <group position={position}>
      {/* X축 치수선 (너비) */}
      <group position={[0, dimensions.height + 0.3, halfDepth + 0.2]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, dimensions.width, 8]} />
          <meshBasicMaterial color="#ff6600" />
          <primitive object={new THREE.Matrix4().makeRotationZ(Math.PI / 2)} attach="matrix" />
        </mesh>
        {/* 끝점 마커들 */}
        <mesh position={[-halfWidth, 0, 0]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color="#ff6600" />
        </mesh>
        <mesh position={[halfWidth, 0, 0]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color="#ff6600" />
        </mesh>
        {/* 치수 텍스트 */}
        <Text
          position={[0, 0.3, 0]}
          fontSize={0.15}
          color="#ff6600"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#ffffff"
        >
          {formatDimension(dimensions.width)}
        </Text>
      </group>

      {/* Z축 치수선 (깊이) */}
      <group position={[halfWidth + 0.2, dimensions.height + 0.3, 0]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, dimensions.depth, 8]} />
          <meshBasicMaterial color="#00ff00" />
          <primitive object={new THREE.Matrix4().makeRotationX(Math.PI / 2)} attach="matrix" />
        </mesh>
        {/* 끝점 마커들 */}
        <mesh position={[0, 0, -halfDepth]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
        <mesh position={[0, 0, halfDepth]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
        {/* 치수 텍스트 */}
        <Text
          position={[0.3, 0, 0]}
          fontSize={0.15}
          color="#00ff00"
          anchorX="center"
          anchorY="middle"
          rotation={[0, Math.PI / 2, 0]}
          outlineWidth={0.01}
          outlineColor="#ffffff"
        >
          {formatDimension(dimensions.depth)}
        </Text>
      </group>

      {/* Y축 치수선 (높이) - 측면에 표시 */}
      <group position={[-halfWidth - 0.2, dimensions.height / 2, 0]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, dimensions.height, 8]} />
          <meshBasicMaterial color="#0066ff" />
        </mesh>
        {/* 끝점 마커들 */}
        <mesh position={[0, -dimensions.height / 2, 0]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color="#0066ff" />
        </mesh>
        <mesh position={[0, dimensions.height / 2, 0]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color="#0066ff" />
        </mesh>
        {/* 치수 텍스트 */}
        <Text
          position={[-0.3, 0, 0]}
          fontSize={0.15}
          color="#0066ff"
          anchorX="center"
          anchorY="middle"
          rotation={[0, 0, Math.PI / 2]}
          outlineWidth={0.01}
          outlineColor="#ffffff"
        >
          {formatDimension(dimensions.height)}
        </Text>
      </group>
    </group>
  );
}