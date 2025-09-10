import { useStore } from "@/components/sim/useStore.js";

export function WallDebugMarkers() {
  const { wallsData } = useStore();

  // 최근에 생성된 벽 하나만 디버깅
  const latestWall = wallsData[wallsData.length - 1];

  if (!latestWall) return null;

  // 벽의 시작점과 끝점 계산
  const { position, rotation, dimensions } = latestWall;
  const halfWidth = dimensions.width / 2;
  const cos = Math.cos(rotation[1]);
  const sin = Math.sin(rotation[1]);

  const startPoint = [
    position[0] - halfWidth * cos,
    0.5, // 바닥에서 약간 위
    position[2] - halfWidth * sin
  ];

  const endPoint = [
    position[0] + halfWidth * cos,
    0.5,
    position[2] + halfWidth * sin
  ];

  return (
    <>
      {/* 시작점 - 빨간색 구 */}
      <mesh position={startPoint}>
        <sphereGeometry args={[0.3]} />
        <meshBasicMaterial color={0xff0000} />
      </mesh>
      
      {/* 끝점 - 파란색 구 */}
      <mesh position={endPoint}>
        <sphereGeometry args={[0.3]} />
        <meshBasicMaterial color={0x0000ff} />
      </mesh>

      {/* 벽 중심점 - 노란색 구 */}
      <mesh position={[position[0], 0.5, position[2]]}>
        <sphereGeometry args={[0.2]} />
        <meshBasicMaterial color={0xffff00} />
      </mesh>
    </>
  );
}