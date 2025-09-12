import { useFrame } from '@react-three/fiber';
import { useStore } from '@/components/sim/useStore';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function TopDownCameraController({ controlsRef }) {
  const { topDownDimensionMode } = useStore();
  const isTransitioning = useRef(false);
  const targetPosition = useRef(new THREE.Vector3());
  const targetTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;
    
    if (topDownDimensionMode) {
      // 탑다운 모드로 전환
      isTransitioning.current = true;
      
      // 타겟 위치 설정
      targetPosition.current.set(0, 50, 0);
      targetTarget.current.set(0, 0, 0);
      
      // 카메라 제약 설정
      controls.enableRotate = false;
      controls.minDistance = 20;
      controls.maxDistance = 100;
      controls.maxPolarAngle = Math.PI / 2.1; // 거의 수직
      controls.minPolarAngle = Math.PI / 2.1;
      
      // 패닝 제한 설정 (탑다운에서 너무 멀리 이동하지 않도록)
      controls.minAzimuthAngle = -Math.PI * 2;
      controls.maxAzimuthAngle = Math.PI * 2;
      
    } else {
      // 일반 모드로 복원
      isTransitioning.current = true;
      
      // 타겟 위치 설정 (기본 3D 뷰)
      targetPosition.current.set(0, 20, 30);
      targetTarget.current.set(0, 0, 0);
      
      // 카메라 제약 해제
      controls.enableRotate = true;
      controls.minDistance = 8;
      controls.maxDistance = 50;
      controls.maxPolarAngle = Math.PI;
      controls.minPolarAngle = 0;
      
      // 각도 제한 해제
      controls.minAzimuthAngle = -Infinity;
      controls.maxAzimuthAngle = Infinity;
    }
  }, [topDownDimensionMode, controlsRef]);

  // 부드러운 카메라 전환을 위한 프레임 업데이트
  useFrame(() => {
    if (!controlsRef.current || !isTransitioning.current) return;
    
    const controls = controlsRef.current;
    const camera = controls.object;
    
    // 현재 위치에서 타겟 위치로 부드럽게 이동
    const lerpFactor = 0.05;
    
    camera.position.lerp(targetPosition.current, lerpFactor);
    controls.target.lerp(targetTarget.current, lerpFactor);
    
    // 전환이 거의 완료되었는지 확인
    const positionDistance = camera.position.distanceTo(targetPosition.current);
    const targetDistance = controls.target.distanceTo(targetTarget.current);
    
    if (positionDistance < 0.1 && targetDistance < 0.1) {
      isTransitioning.current = false;
      camera.position.copy(targetPosition.current);
      controls.target.copy(targetTarget.current);
    }
    
    controls.update();
  });

  // 탑다운 모드에서 추가 제약 조건 적용
  useFrame(() => {
    if (topDownDimensionMode && controlsRef.current && !isTransitioning.current) {
      const controls = controlsRef.current;
      const camera = controls.object;
      
      // Y 위치가 최소값 아래로 내려가지 않도록 제한
      if (camera.position.y < 15) {
        camera.position.y = 15;
        controls.update();
      }
      
      // 카메라가 너무 기울어지지 않도록 제한
      const horizontalDistance = Math.sqrt(
        camera.position.x * camera.position.x + 
        camera.position.z * camera.position.z
      );
      
      if (camera.position.y < horizontalDistance * 0.5) {
        camera.position.y = Math.max(camera.position.y, horizontalDistance * 0.5);
        controls.update();
      }
    }
  });

  return null;
}