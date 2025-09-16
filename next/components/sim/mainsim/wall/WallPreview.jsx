import { useRef, useMemo, useEffect, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/components/sim/useStore.js";

// 펄스 링 컴포넌트
function PulseRing({ position }) {
  const ringRef = useRef();
  const centerRef = useRef();
  
  useFrame((state) => {
    if (ringRef.current && centerRef.current) {
      const time = state.clock.elapsedTime;
      // 펄스 애니메이션
      const scale = 1 + Math.sin(time * 4) * 0.3;
      const opacity = 0.8 - Math.sin(time * 4) * 0.3;
      
      ringRef.current.scale.setScalar(scale);
      ringRef.current.material.opacity = opacity;
      
      // 중심점 회전
      centerRef.current.rotation.y = time * 2;
    }
  });
  
  return (
    <group position={position}>
      {/* 중심 점 */}
      <mesh ref={centerRef}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>
      
      {/* 펄스 링 */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.2, 16]} />
        <meshBasicMaterial 
          color="#00ff88" 
          transparent 
          opacity={0.6}
        />
      </mesh>
    </group>
  );
}

export function WallPreview() {
  const { wallToolMode, wallDrawingStart } = useStore();
  const { camera, gl, invalidate } = useThree();
  const lineRef = useRef(null);
  const [mouseNDC, setMouseNDC] = useState(new THREE.Vector2(0, 0));
  
  // 튜브용 커브와 지오메트리 생성
  const [tubeGeometry, setTubeGeometry] = useState(null);

  // 마우스 움직임을 직접 추적
  useEffect(() => {
    if (wallToolMode !== 'add' || !wallDrawingStart) return;

    const canvas = gl.domElement;
    
    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      setMouseNDC(new THREE.Vector2(x, y));
      
      // 렌더링 프레임 무효화하여 강제 업데이트
      invalidate();
    };

    canvas.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [wallToolMode, wallDrawingStart, gl.domElement, invalidate]);

  useFrame(() => {
    if (wallToolMode === 'add' && wallDrawingStart) {
      // 마우스 NDC 좌표로 raycaster 생성
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouseNDC, camera);
      
      // Y=0 평면과의 교점 계산 (바닥 평면)
      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectPoint = new THREE.Vector3();
      const intersection = raycaster.ray.intersectPlane(floorPlane, intersectPoint);

      if (intersection) {
        // 마우스 위치와 시작점 간의 차이 계산
        const deltaX = intersectPoint.x - wallDrawingStart[0];
        const deltaZ = intersectPoint.z - wallDrawingStart[2];
        
        // 더 긴 축을 기준으로 90도 각도로 제한
        let alignedX, alignedZ;
        
        if (Math.abs(deltaX) > Math.abs(deltaZ)) {
          // X축 방향 벽 (수평)
          alignedX = intersectPoint.x;
          alignedZ = wallDrawingStart[2];
        } else {
          // Z축 방향 벽 (수직)
          alignedX = wallDrawingStart[0];
          alignedZ = intersectPoint.z;
        }
        
        // 시작점과 끝점으로 커브 생성
        const startPoint = new THREE.Vector3(wallDrawingStart[0], 0, wallDrawingStart[2]);
        const endPoint = new THREE.Vector3(alignedX, 0, alignedZ);
        
        // 직선 커브 생성
        const curve = new THREE.LineCurve3(startPoint, endPoint);
        
        // 튜브 지오메트리 생성 : 선 굵기 등 설정 
        const newGeometry = new THREE.TubeGeometry(curve, 20, 0.04, 8, false);
        setTubeGeometry(newGeometry);
      }
    }
  });

  if (wallToolMode !== 'add' || !wallDrawingStart) {
    return null;
  }

  return (
    <>
      {/* 시작점 표시 - 펄스 링 스타일 */}
      <PulseRing position={[wallDrawingStart[0], 0.04, wallDrawingStart[2]]} />
      
      {/* [09.11] 임시 벽 선 표시 - 튜브 지오메트리 */}
      {tubeGeometry && (
        <mesh ref={lineRef}>
          <primitive object={tubeGeometry} />
          <meshBasicMaterial color={0x1E90FF} />
        </mesh>
      )}
    </>
  );
}