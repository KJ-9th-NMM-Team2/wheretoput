import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function KeyboardControls({ controlsRef }) {
  const keys = useRef({});
  const { camera } = useThree();

  useEffect(() => {
    const handleKeyDown = (e) => {
      keys.current[e.code] = true;
    };
    const handleKeyUp = (e) => {
      keys.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [camera, controlsRef]);

  useFrame((_, delta) => {
    const speed = 10;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    // W,S키 입력 시 바라보는    방향으로 정확히 이동 : 주석 처리
    //                      방향의 X,Z 방향만 고려 : 주석 해제 (오늘의 집에선 이걸 사용)
    forward.y = 0;

    const right = new THREE.Vector3();
    right.crossVectors(camera.up, forward).normalize();

    let move = new THREE.Vector3();

    if (keys.current["KeyW"]) move.add(forward);
    if (keys.current["KeyS"]) move.add(forward.clone().negate());
    if (keys.current["KeyA"]) move.add(right);
    if (keys.current["KeyD"]) move.add(right.clone().negate());

    if (keys.current["Space"] && !keys.current["ShiftLeft"]) move.add(new THREE.Vector3(0, 1, 0));
    if (keys.current["ShiftLeft"] && !keys.current["Space"]) move.add(new THREE.Vector3(0, -1, 0));

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * delta);
      camera.position.add(move);

      if (controlsRef?.current) {
        controlsRef.current.target.add(move);
      }
    }
  });

  return null;
}
