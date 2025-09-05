import { useState, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { on } from "events";
import { useStore } from "@/components/sim/useStore";
import { useHistoryDrag } from "@/components/sim/history/useHistoryDrag";

export function useObjectControls(
  modelId,
  onPositionChange,
  onRotationChange,
  onScaleChange,
  onSelect,
  onHover,
  controlsRef
) {
  const { camera, gl, raycaster, mouse } = useThree();
  const { loadedModels, isModelLocked } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const [dragOffset, setDragOffset] = useState(new THREE.Vector3());
  const [initialMouseY, setInitialMouseY] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  
  // 히스토리 기능
  const { startDrag, endDragMove, endDragScale, cancelDrag } = useHistoryDrag();

  const handlePointerDown = useCallback(
    (e) => {
      e.stopPropagation();
      
      // 🔒 락 체크 - 맨 처음에!
      if (isModelLocked(modelId)) {
        console.log("🚫 모델이 락되어 있어서 상호작용 차단:", modelId);
        return; // 모든 상호작용 차단
      }
      
      onSelect(modelId);

      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }

      const currentModel = loadedModels.find((model) => model.id === modelId);
      
      if (e.shiftKey) {
        // Shift + 클릭으로 크기 조정 모드
        setIsScaling(true);
        setInitialMouseY(e.clientY);
        const currentScale = currentModel?.scale || 1;
        setInitialScale(currentScale);
        
        // 히스토리에 드래그 시작 기록 (스케일)
        startDrag(
          modelId,
          undefined, // position
          undefined, // rotation  
          { x: currentScale, y: currentScale, z: currentScale }
        );
        
        gl.domElement.style.cursor = "ns-resize";
      } else {
        // 일반 클릭으로 이동 모드
        setIsDragging(true);

        const rect = gl.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const currentY = currentModel ? currentModel.position[1] : 0;
        const floorPlane = new THREE.Plane(
          new THREE.Vector3(0, 1, 0),
          -currentY
        );
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(floorPlane, intersectPoint);

        if (intersectPoint && e.currentTarget && e.currentTarget.position) {
          setDragOffset(intersectPoint.clone().sub(e.currentTarget.position));
        }

        // 히스토리에 드래그 시작 기록 (위치)
        if (currentModel?.position) {
          startDrag(
            modelId,
            { x: currentModel.position[0], y: currentModel.position[1], z: currentModel.position[2] }
          );
        }

        gl.domElement.style.cursor = "grabbing";
      }
    },
    [modelId, onSelect, camera, gl, raycaster, mouse, controlsRef, loadedModels, startDrag]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (isDragging) {
        const rect = gl.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const currentModel = loadedModels.find((model) => model.id === modelId);
        const currentY = currentModel ? currentModel.position[1] : 0;
        const floorPlane = new THREE.Plane(
          new THREE.Vector3(0, 1, 0),
          -currentY
        );
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(floorPlane, intersectPoint);
        if (intersectPoint) {
          const newPosition = intersectPoint.clone().sub(dragOffset);
          onPositionChange(modelId, [
            newPosition.x,
            newPosition.y,
            newPosition.z,
          ], true, true); // shouldBroadcast=true, isDragging=true
        }
      } else if (isScaling) {
        const deltaY = (initialMouseY - e.clientY) * 0.01;
        const newScale = Math.max(0.1, Math.min(5, initialScale + deltaY));
        onScaleChange(modelId, newScale);
      }
    },
    [
      isDragging,
      isScaling,
      initialMouseY,
      initialScale,
      modelId,
      onPositionChange,
      onScaleChange,
      camera,
      gl,
      raycaster,
      mouse,
      dragOffset,
      loadedModels,
    ]
  );

  const handlePointerUp = useCallback(() => {
    const currentModel = loadedModels.find((model) => model.id === modelId);
    
    if (isDragging && currentModel?.position) {
      // 드래그 완료시 최종 위치를 브로드캐스트 
      onPositionChange(modelId, currentModel.position, true, false); // shouldBroadcast=true, isDragging=false
      
      // 이동 완료 시 히스토리에 기록
      endDragMove(
        modelId,
        { x: currentModel.position[0], y: currentModel.position[1], z: currentModel.position[2] },
        `가구 "${modelId}"를 이동했습니다`
      );
    } else if (isScaling && currentModel?.scale) {
      // 크기 조정 완료 시 히스토리에 기록
      const scale = currentModel.scale;
      endDragScale(
        modelId,
        { x: scale, y: scale, z: scale },
        `가구 "${modelId}" 크기를 변경했습니다`
      );
    }
    
    setIsDragging(false);
    setIsScaling(false);
    gl.domElement.style.cursor = "auto";

    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }
  }, [isDragging, isScaling, modelId, loadedModels, endDragMove, endDragScale, gl, controlsRef]);

  const handlePointerOver = useCallback(() => {
    onHover(modelId);

    if (!isDragging && !isScaling) {
      gl.domElement.style.cursor = "pointer";
    }
  }, [modelId, gl, isDragging, isScaling, onHover]);

  const handlePointerOut = useCallback(() => {
    onHover(null);

    if (!isDragging && !isScaling) {
      gl.domElement.style.cursor = "auto";
    }
  }, [gl, isDragging, isScaling, onHover]);

  return {
    isDragging,
    isScaling,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerOver,
    handlePointerOut,
  };
}
