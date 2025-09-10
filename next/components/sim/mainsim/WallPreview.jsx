import { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/components/sim/useStore.js";

export function WallPreview() {
  const { wallToolMode, wallDrawingStart } = useStore();
  const { pointer, camera, raycaster } = useThree();
  const lineRef = useRef(null);

  useEffect(() => {
    if (wallToolMode === 'add' && wallDrawingStart && lineRef.current) {
      // 마우스 위치로부터 바닥과의 교점 계산
      raycaster.setFromCamera(pointer, camera);
      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(floorPlane, intersectPoint);

      if (intersectPoint) {
        // 시작점과 현재 마우스 위치를 연결하는 선 그리기
        const points = [
          new THREE.Vector3(wallDrawingStart[0], wallDrawingStart[1], wallDrawingStart[2]),
          new THREE.Vector3(intersectPoint.x, 0, intersectPoint.z)
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        lineRef.current.geometry = geometry;
      }
    }
  });

  if (wallToolMode !== 'add' || !wallDrawingStart) {
    return null;
  }

  return (
    <>
      {/* 시작점 표시 */}
      <mesh position={wallDrawingStart}>
        <sphereGeometry args={[0.2]} />
        <meshBasicMaterial color={0x00ff00} />
      </mesh>
      
      {/* 임시 벽 선 표시 */}
      <line ref={lineRef}>
        <bufferGeometry />
        <lineBasicMaterial color={0xff9933} linewidth={3} />
      </line>
    </>
  );
}