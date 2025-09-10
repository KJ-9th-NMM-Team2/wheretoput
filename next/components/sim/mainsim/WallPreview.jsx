import { useRef, useMemo, useEffect, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/components/sim/useStore.js";

export function WallPreview() {
  const { wallToolMode, wallDrawingStart } = useStore();
  const { camera, gl, invalidate } = useThree();
  const lineRef = useRef(null);
  const [mouseNDC, setMouseNDC] = useState(new THREE.Vector2(0, 0));
  
  // geometry와 positions를 미리 생성
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(6); // 2 points * 3 coordinates
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, []);

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
    if (wallToolMode === 'add' && wallDrawingStart && lineRef.current && lineRef.current.geometry) {
      // 마우스 NDC 좌표로 raycaster 생성
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouseNDC, camera);
      
      // Y=0 평면과의 교점 계산 (바닥 평면)
      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectPoint = new THREE.Vector3();
      const intersection = raycaster.ray.intersectPlane(floorPlane, intersectPoint);

      if (intersection) {
        // 기존 geometry의 position attribute 업데이트
        const positions = lineRef.current.geometry.attributes.position.array;
        
        // 시작점 (Y=0으로 고정)
        positions[0] = wallDrawingStart[0];
        positions[1] = 0;
        positions[2] = wallDrawingStart[2];
        
        // 끝점 (Y=0으로 고정)
        positions[3] = intersectPoint.x;
        positions[4] = 0;
        positions[5] = intersectPoint.z;
        
        // geometry 업데이트 알림
        lineRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }
  });

  if (wallToolMode !== 'add' || !wallDrawingStart) {
    return null;
  }

  return (
    <>
      {/* 시작점 표시 (Y=0으로 고정) */}
      <mesh position={[wallDrawingStart[0], 0, wallDrawingStart[2]]}>
        <sphereGeometry args={[0.2]} />
        <meshBasicMaterial color={0x00ff00} />
      </mesh>
      
      {/* 임시 벽 선 표시 */}
      <line ref={lineRef}>
        <primitive object={geometry} />
        <lineBasicMaterial color={0x00ff00} linewidth={5} />
      </line>
    </>
  );
}