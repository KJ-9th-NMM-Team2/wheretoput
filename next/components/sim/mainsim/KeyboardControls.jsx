import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function KeyboardControls({ controlsRef, disabled = false }) {
  const keys = useRef({});
  const { camera, invalidate } = useThree();
  const velocityRef = useRef(new THREE.Vector3());
  const lastDirectionRef = useRef(new THREE.Vector3());
  const lastTargetRef = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleKeyDown = (e) => {
      keys.current[e.code] = true;
      // 키 입력 시 velocity 리셋하지 않고 즉시 렌더링 요청
      invalidate();
    };
    const handleKeyUp = (e) => {
      keys.current[e.code] = false;
      invalidate();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [camera, controlsRef, invalidate]);

  useFrame((state, delta) => {
    if (disabled) return;

    // OrbitControls 타겟 변화 감지 및 velocity 리셋
    if (controlsRef?.current?.target) {
      const currentTarget = controlsRef.current.target;
      if (!lastTargetRef.current.equals(currentTarget)) {
        // 타겟이 변경되면 velocity 리셋하여 갑작스러운 움직임 방지
        velocityRef.current.set(0, 0, 0);
        lastTargetRef.current.copy(currentTarget);
      }
    }

    const anyKeyPressed = 
      keys.current["KeyW"] || keys.current["KeyS"] || 
      keys.current["KeyA"] || keys.current["KeyD"] ||
      keys.current["KeyQ"] || keys.current["KeyE"];

    const baseSpeed = 15;
    const acceleration = 50;
    const deceleration = 25;
    const maxSpeed = 20;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(camera.up, forward).normalize();

    let inputDirection = new THREE.Vector3();

    if (keys.current["KeyW"]) inputDirection.add(forward);
    if (keys.current["KeyS"]) inputDirection.sub(forward);
    if (keys.current["KeyA"]) inputDirection.add(right);
    if (keys.current["KeyD"]) inputDirection.sub(right);

    if (keys.current["KeyQ"]) inputDirection.add(new THREE.Vector3(0, 1, 0));
    if (keys.current["KeyE"]) inputDirection.add(new THREE.Vector3(0, -1, 0));

    if (inputDirection.lengthSq() > 0) {
      inputDirection.normalize();
      
      const targetVelocity = inputDirection.clone().multiplyScalar(baseSpeed);
      const velocityDiff = targetVelocity.clone().sub(velocityRef.current);
      
      velocityRef.current.add(velocityDiff.multiplyScalar(acceleration * delta));
      
      if (velocityRef.current.length() > maxSpeed) {
        velocityRef.current.normalize().multiplyScalar(maxSpeed);
      }
      
      lastDirectionRef.current.copy(inputDirection);
    } else {
      velocityRef.current.multiplyScalar(Math.max(0, 1 - deceleration * delta));
    }

    if (velocityRef.current.lengthSq() > 0.001) {
      const movement = velocityRef.current.clone().multiplyScalar(delta);
      camera.position.add(movement);

      if (controlsRef?.current) {
        controlsRef.current.target.add(movement);
        controlsRef.current.update();
      }
    }
  });

  return null;
}
