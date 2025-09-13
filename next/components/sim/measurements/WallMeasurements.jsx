import React, { useMemo } from "react";
import { Html, Line } from "@react-three/drei";
import { Text } from "@react-three/drei";
import { useStore } from "@/components/sim/useStore";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  findConnectedWallGroups,
  mergeWallGroup,
  getWallEndpoints,
} from "@/components/sim/wall/wallUtils.js";

export function WallMeasurements() {
  const { wallsData, showMeasurements } = useStore();
  const { camera } = useThree();

  const wallMeasurements = useMemo(() => {
    try {
      if (
        !showMeasurements ||
        !wallsData ||
        !Array.isArray(wallsData) ||
        wallsData.length === 0
      ) {
        return [];
      }

      // MergedWalls와 동일한 로직으로 벽 그룹 찾기
      const connectedGroups = findConnectedWallGroups(wallsData);

      // 그룹에 속하지 않은 독립적인 벽들 찾기
      const groupedWallIds = new Set();
      connectedGroups.forEach((group) => {
        group.forEach((wall) => groupedWallIds.add(wall.id));
      });

      const standaloneWalls = wallsData.filter(
        (wall) => !groupedWallIds.has(wall.id)
      );

      // 각 그룹을 병합된 벽으로 변환
      const mergedWalls = connectedGroups
        .map((group) => mergeWallGroup(group))
        .filter(Boolean);

      const measurements = [];

      // 병합된 벽들의 측정값
      mergedWalls.forEach((mergedWall) => {
        const { id, position, dimensions, rotation } = mergedWall;

        // 병합된 벽의 끝점 계산
        const endpoints = getWallEndpoints(mergedWall);

        // 벽의 dimensions.width 사용 (병합된 벽의 전체 길이)
        const length = dimensions.width || 0;
        const lengthInMm = Math.round(length * 1000);

        // 측정선의 실제 각도 계산
        const deltaX = endpoints.end[0] - endpoints.start[0];
        const deltaZ = endpoints.end[1] - endpoints.start[1];
        let displayRotation = Math.atan2(deltaZ, deltaX);

        // 텍스트가 거꾸로 보이지 않도록 조정 (90도보다 크면 180도 회전)
        if (Math.abs(displayRotation) > Math.PI / 2) {
          displayRotation = displayRotation + Math.PI;
        }

        measurements.push({
          id,
          position: [position[0], 2.7, position[2]],
          length: lengthInMm,
          rotation: displayRotation,
          isMerged: true,
          originalWallsCount: mergedWall.originalWalls?.length || 1,
          startPoint: [endpoints.start[0], 2.7, endpoints.start[1]],
          endPoint: [endpoints.end[0], 2.7, endpoints.end[1]],
        });
      });

      // 독립적인 벽들의 측정값
      standaloneWalls.forEach((wall) => {
        if (
          !wall ||
          !wall.id ||
          !wall.position ||
          !wall.dimensions ||
          !wall.rotation
        ) {
          return;
        }

        const { id, position, dimensions, rotation } = wall;
        const length = dimensions.width || 0;
        const lengthInMm = Math.round(length * 1000);

        // 독립 벽의 끝점 계산
        const endpoints = getWallEndpoints(wall);

        // 측정선의 실제 각도 계산
        const deltaX = endpoints.end[0] - endpoints.start[0];
        const deltaZ = endpoints.end[1] - endpoints.start[1];
        let displayRotation = Math.atan2(deltaZ, deltaX);

        // 텍스트가 거꾸로 보이지 않도록 조정 (90도보다 크면 180도 회전)
        if (Math.abs(displayRotation) > Math.PI / 2) {
          displayRotation = displayRotation + Math.PI;
        }

        measurements.push({
          id,
          position: [position[0], 2.7, position[2]],
          length: lengthInMm,
          rotation: displayRotation,
          isMerged: false,
          startPoint: [endpoints.start[0], 2.7, endpoints.start[1]],
          endPoint: [endpoints.end[0], 2.7, endpoints.end[1]],
        });
      });

      return measurements;
    } catch (error) {
      console.error("WallMeasurements calculation error:", error);
      return [];
    }
  }, [wallsData, showMeasurements]);

  if (!showMeasurements || wallMeasurements.length === 0) {
    return null;
  }

  try {
    return (
      <>
        {wallMeasurements.map((measurement) => (
          <group key={measurement.id}>
            {/* 측정선 - 벽의 시작점에서 끝점까지 */}
            <Line
              points={[measurement.startPoint, measurement.endPoint]}
              color="#3b82f6"
              lineWidth={1}
              dashed={false}
            />

            {/* 시작점 표시 */}
            <mesh position={measurement.startPoint}>
              <sphereGeometry args={[0.05, 1.5, 1.5]} />
              <meshBasicMaterial color="#3b82f6" />
            </mesh>

            {/* 끝점 표시 */}
            <mesh position={measurement.endPoint}>
              <sphereGeometry args={[0.05, 1.5, 1.5]} />
              <meshBasicMaterial color="#3b82f6" />
            </mesh>

            {/* 측정값 텍스트 - 벽 중앙에 */}
            <group position={measurement.position}>
              <Html
                center
                distanceFactor={15}
                transform={false}
                zIndexRange={[10, 20]}
                style={{
                  pointerEvents: "none",
                  userSelect: "none",
                }}
                opacity
              >
                <div
                  className="bg-blue-600 font-bold text-white rounded border px-2 border-blue-800 shadow-lg"
                  style={{
                    fontSize: "12px",
                    textAlign: "center",
                    transform: `rotate(${measurement.rotation}rad)`,
                  }}
                >
                  {measurement.length}
                </div>
              </Html>
            </group>
          </group>
        ))}
      </>
    );
  } catch (error) {
    console.error("WallMeasurements render error:", error);
    return null;
  }
}
