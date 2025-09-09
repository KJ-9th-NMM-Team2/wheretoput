import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function KeyboardControls({ controlsRef, disabled = false }) {
  const keys = useRef({});
  const { camera, invalidate } = useThree();
  const velocityRef = useRef(new THREE.Vector3());
  const lastDirectionRef = useRef(new THREE.Vector3());
  const lastTargetRef = useRef(new THREE.Vector3());
  const isMovingRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // 키 반복 이벤트 무시
      if (e.repeat) return;
      
      keys.current[e.code] = true;
      if (!isMovingRef.current) {
        isMovingRef.current = true;
        invalidate();
      }
    };
    const handleKeyUp = (e) => {
      keys.current[e.code] = false;
      
      // 모든 이동 키가 해제되었는지 확인
      const anyKeyPressed = 
        keys.current["KeyW"] || keys.current["KeyS"] || 
        keys.current["KeyA"] || keys.current["KeyD"] ||
        keys.current["KeyQ"] || keys.current["KeyE"];
      
      if (!anyKeyPressed) {
        isMovingRef.current = false;
      }
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

    // delta 값이 너무 클 때 보정 (초기 프레임에서 발생할 수 있음)
    delta = Math.min(delta, 1/30); // 최대 30fps 기준으로 제한

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
      
      // 부드러운 가속을 위한 lerp 방식 사용
      const lerpFactor = Math.min(acceleration * delta, 1.0);
      velocityRef.current.lerp(targetVelocity, lerpFactor);
      
      if (velocityRef.current.length() > maxSpeed) {
        velocityRef.current.normalize().multiplyScalar(maxSpeed);
      }
      
      lastDirectionRef.current.copy(inputDirection);
    } else {
      // 감속도 lerp 방식으로 부드럽게
      const stopTarget = new THREE.Vector3(0, 0, 0);
      const lerpFactor = Math.min(deceleration * delta, 1.0);
      velocityRef.current.lerp(stopTarget, lerpFactor);
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
