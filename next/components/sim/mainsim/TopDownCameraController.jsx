import { useFrame } from '@react-three/fiber';
import { useStore } from '@/components/sim/useStore';
import { useEffect } from 'react';

export function TopDownCameraController({ controlsRef }) {
  const { topDownDimensionMode } = useStore();

  useEffect(() => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;

    if (topDownDimensionMode) {
      // 탑다운 모드: 카메라를 제한
      controls.enableRotate = false; // 회전 비활성화
      controls.minDistance = 20;
      controls.maxDistance = 100;
      controls.maxPolarAngle = Math.PI / 2; // 수평선까지만
      controls.minPolarAngle = Math.PI / 2; // 수평선부터
      
      // 카메라를 탑다운 위치로 이동
      controls.object.position.set(0, 50, 0);
      controls.target.set(0, 0, 0);
      controls.update();
    } else {
      // 일반 모드: 자유로운 카메라 움직임
      controls.enableRotate = true;
      controls.minDistance = 8;
      controls.maxDistance = 50;
      controls.maxPolarAngle = Math.PI; // 제한 없음
      controls.minPolarAngle = 0;
      
      // 기본 카메라 위치로 복원
      controls.object.position.set(0, 20, 30);
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [topDownDimensionMode, controlsRef]);

  // 탑다운 모드에서 카메라 위치를 지속적으로 제한
  useFrame(() => {
    if (topDownDimensionMode && controlsRef.current) {
      const controls = controlsRef.current;
      const camera = controls.object;
      
      // Y 위치가 최소값 아래로 내려가지 않도록 제한
      if (camera.position.y < 20) {
        camera.position.y = 20;
        controls.update();
      }
      
      // 카메라가 수평 아래로 내려가지 않도록 제한
      if (camera.position.y < Math.abs(camera.position.x) || camera.position.y < Math.abs(camera.position.z)) {
        const maxHorizontal = Math.max(Math.abs(camera.position.x), Math.abs(camera.position.z));
        camera.position.y = Math.max(camera.position.y, maxHorizontal * 1.2);
        controls.update();
      }
    }
  });

  return null;
}