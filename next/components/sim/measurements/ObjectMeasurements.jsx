import React, { useMemo } from "react";
import { Html } from "@react-three/drei";
import { useStore } from "@/components/sim/useStore";

export function ObjectMeasurements() {
  const { loadedModels, selectedModelId, showMeasurements } = useStore();

  const objectMeasurements = useMemo(() => {
    try {
      if (!showMeasurements || !selectedModelId) return null;

      const selectedModel = loadedModels.find(
        (model) => model.id === selectedModelId
      );
      if (!selectedModel) return null;

      const { position, scale, length, rotation } = selectedModel;

      // 물체의 실제 크기 계산 (scale과 length를 고려)
      const actualScale = Array.isArray(scale) ? scale : [scale, scale, scale];
      const actualLength = Array.isArray(length)
        ? length
        : [length, length, length];

      // mm 단위로 변환
      const width = Math.round(actualScale[0] * actualLength[0]);
      const height = Math.round(actualScale[1] * actualLength[1]);
      const depth = Math.round(actualScale[2] * actualLength[2]);

      // 회전 값 추출 (Y축 회전)
      const rotationY = Array.isArray(rotation) ? rotation[1] : 0;

      // 물체의 각 변 중앙에 측정값 배치
      const halfWidth = (actualScale[0] * actualLength[0]) / 1000 / 2;
      const halfDepth = (actualScale[2] * actualLength[2]) / 1000 / 2;

      // Width 측정값: depth 방향 변의 중앙
      const widthOffset = [
        -Math.sin(rotationY) * halfDepth,
        0,
        Math.cos(rotationY) * halfDepth,
      ];

      // Depth 측정값: width 방향 변의 중앙
      const depthOffset = [
        Math.cos(rotationY) * halfWidth,
        0,
        Math.sin(rotationY) * halfWidth,
      ];

      return {
        position,
        rotation: rotationY,
        width,
        height,
        depth,
        halfWidth,
        halfDepth,
      };
    } catch (error) {
      console.error("ObjectMeasurements calculation error:", error);
      return null;
    }
  }, [loadedModels, selectedModelId, showMeasurements]);

  if (!showMeasurements || !objectMeasurements) return null;

  const { position, rotation, width, height, depth, halfWidth, halfDepth } =
    objectMeasurements;

  try {
    return (
      <group position={position} rotation={[0, rotation, 0]}>
        {/* Width 표시 - 물체의 Width 방향 (X축) */}
        <group position={[0, height / 1000, -halfDepth]} rotation={[0, 0, 0]}>
          <Html
            center
            distanceFactor={12}
            transform={false}
            occlude={false}
            zIndexRange={[10, 20]}
            style={{
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            <div
              className="bg-green-600 font-bold px-1 text-white rounded border border-green-800 shadow-lg"
              style={{
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              {width}
            </div>
          </Html>
        </group>

        {/* Depth 표시 - 물체의 Depth 방향 (Z축) */}
        <group
          position={[halfWidth, height / 1000, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <Html
            center
            distanceFactor={12}
            transform={false}
            occlude={false}
            zIndexRange={[10, 20]}
            style={{
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            <div
              className="bg-green-600 font-bold px-1 text-white rounded border border-green-800 shadow-lg"
              style={{
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              {depth}
            </div>
          </Html>
        </group>
      </group>
    );
  } catch (error) {
    console.error("ObjectMeasurements render error:", error);
    return null;
  }
}
