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
  controlsRef,
  getSelectionBoxSize,
  meshRef
) {
  const { camera, gl, raycaster, mouse } = useThree();
  const { loadedModels, isModelLocked, wallsData, enableWallMagnet } =
    useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const [dragOffset, setDragOffset] = useState(new THREE.Vector3());
  const [initialMouseY, setInitialMouseY] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const [isSnappedToWall, setIsSnappedToWall] = useState(false);

  // 히스토리 기능
  const { startDrag, endDragMove, endDragScale } = useHistoryDrag();

  // 벽 자석 기능 - 바운딩 박스 기준으로 가장 가까운 벽까지의 거리와 스냅 위치 계산
  const findNearestWallSnap = useCallback(
    (position, rotation) => {
      if (
        !enableWallMagnet ||
        !wallsData ||
        wallsData.length === 0 ||
        !getSelectionBoxSize ||
        !meshRef.current
      )
        return null;

      const SNAP_DISTANCE = 0.7; // 70cm 이내에서 자석 효과 발동
      const WALL_OFFSET = 0.05; // 벽에서 5cm 떨어진 위치에 스냅

      // SelectionBox에서 정확한 크기 정보 가져오기
      let furnitureWidth, furnitureHeight, furnitureDepth;
      try {
        [furnitureWidth, furnitureHeight, furnitureDepth] =
          getSelectionBoxSize();
      } catch (error) {
        console.warn("Failed to get selection box size:", error);
        return null;
      }

      const furnitureHalfWidth = furnitureWidth / 2;
      const furnitureHalfDepth = furnitureDepth / 2;

      // 모든 벽의 모든 면에 대한 후보들을 수집
      const allCandidates = [];

      // 가구가 회전되어 있다면 바운딩 박스도 회전된 상태로 계산해야 함
      // 단순화를 위해 axis-aligned 바운딩 박스 사용 (회전 무시)
      // 정확한 계산을 위해서는 oriented bounding box 필요

      // 각 벽에 대해 거리 계산
      wallsData.forEach((wall) => {
        const wallPos = new THREE.Vector3(...wall.position);
        const wallRotation = wall.rotation[1]; // Y축 회전각
        const wallWidth = wall.dimensions.width;
        const wallDepth = wall.dimensions.depth;

        // 벽의 로컬 좌표계에서 계산
        const relativePos = new THREE.Vector3(
          position.x - wallPos.x,
          0,
          position.z - wallPos.z
        );

        // 벽의 회전을 고려하여 로컬 좌표로 변환
        const cos = Math.cos(-wallRotation);
        const sin = Math.sin(-wallRotation);
        const localX = relativePos.x * cos - relativePos.z * sin;
        const localZ = relativePos.x * sin + relativePos.z * cos;

        // 벽의 면들에 대한 거리 계산
        const halfWidth = wallWidth / 2;
        const halfDepth = wallDepth / 2;

        // 이 벽의 모든 면에 대한 후보들을 수집

        // SelectionBox 정확한 크기 기준 표면 간 실제 거리 계산 (Z축 방향)
        if (Math.abs(localX) <= halfWidth + furnitureHalfWidth) {
          // 가구 표면 위치 계산 (SelectionBox 크기 기준)
          const furnitureFrontEdge = localZ + furnitureHalfDepth; // 가구 앞면
          const furnitureBackEdge = localZ - furnitureHalfDepth; // 가구 뒷면

          // 벽 표면 위치 계산
          const wallFrontEdge = halfDepth; // 벽 앞면
          const wallBackEdge = -halfDepth; // 벽 뒷면

          // 앞면 (positive Z) - 가구 뒷면과 벽 앞면 간의 거리
          const frontSurfaceDistance = Math.abs(
            furnitureBackEdge - wallFrontEdge
          );

          // 가구가 벽 앞쪽에 있고, 표면 간 거리가 스냅 범위 내일 때
          if (
            furnitureBackEdge > wallFrontEdge &&
            frontSurfaceDistance < SNAP_DISTANCE
          ) {
            const snapLocalZ = wallFrontEdge + WALL_OFFSET + furnitureHalfDepth;

            allCandidates.push({
              distance: frontSurfaceDistance,
              snapPosition: {
                x: wallPos.x + (localX * cos + snapLocalZ * sin),
                y: position.y,
                z: wallPos.z + (-localX * sin + snapLocalZ * cos),
              },
              wall: wall,
              face: "front",
            });
          }

          // 뒷면 (negative Z) - 가구 앞면과 벽 뒷면 간의 거리
          const backSurfaceDistance = Math.abs(
            furnitureFrontEdge - wallBackEdge
          );

          // 가구가 벽 뒤쪽에 있고, 표면 간 거리가 스냅 범위 내일 때
          if (
            furnitureFrontEdge < wallBackEdge &&
            backSurfaceDistance < SNAP_DISTANCE
          ) {
            const snapLocalZ = wallBackEdge - WALL_OFFSET - furnitureHalfDepth;
            allCandidates.push({
              distance: backSurfaceDistance,
              snapPosition: {
                x: wallPos.x + (localX * cos + snapLocalZ * sin),
                y: position.y,
                z: wallPos.z + (-localX * sin + snapLocalZ * cos),
              },
              wall: wall,
              face: "back",
            });
          }
        }

        // SelectionBox 정확한 크기 기준 표면 간 실제 거리 계산 (X축 방향)
        if (Math.abs(localZ) <= halfDepth + furnitureHalfDepth) {
          // 가구 표면 위치 계산 (SelectionBox 크기 기준)
          const furnitureLeftEdge = localX - furnitureHalfWidth; // 가구 좌면
          const furnitureRightEdge = localX + furnitureHalfWidth; // 가구 우면

          // 벽 표면 위치 계산
          const wallLeftEdge = -halfWidth; // 벽 좌면
          const wallRightEdge = halfWidth; // 벽 우면

          // 우면 (positive X) - 가구 좌면과 벽 우면 간의 거리
          const rightSurfaceDistance = Math.abs(
            furnitureLeftEdge - wallRightEdge
          );

          // 가구가 벽 오른쪽에 있고, 표면 간 거리가 스냅 범위 내일 때
          if (
            furnitureLeftEdge > wallRightEdge &&
            rightSurfaceDistance < SNAP_DISTANCE
          ) {
            const snapLocalX = wallRightEdge + WALL_OFFSET + furnitureHalfWidth;
            allCandidates.push({
              distance: rightSurfaceDistance,
              snapPosition: {
                x: wallPos.x + (snapLocalX * cos + localZ * sin),
                y: position.y,
                z: wallPos.z + (-snapLocalX * sin + localZ * cos),
              },
              wall: wall,
              face: "right",
            });
          }

          // 좌면 (negative X) - 가구 우면과 벽 좌면 간의 거리
          const leftSurfaceDistance = Math.abs(
            furnitureRightEdge - wallLeftEdge
          );

          // 가구가 벽 왼쪽에 있고, 표면 간 거리가 스냅 범위 내일 때
          if (
            furnitureRightEdge < wallLeftEdge &&
            leftSurfaceDistance < SNAP_DISTANCE
          ) {
            const snapLocalX = wallLeftEdge - WALL_OFFSET - furnitureHalfWidth;
            allCandidates.push({
              distance: leftSurfaceDistance,
              snapPosition: {
                x: wallPos.x + (snapLocalX * cos + localZ * sin),
                y: position.y,
                z: wallPos.z + (-snapLocalX * sin + localZ * cos),
              },
              wall: wall,
              face: "left",
            });
          }
        }
      });

      // 모든 벽의 모든 면 중에서 전체적으로 가장 가까운 면 선택
      if (allCandidates.length > 0) {
        const closestCandidate = allCandidates.reduce((closest, current) =>
          current.distance < closest.distance ? current : closest
        );

        return {
          wall: closestCandidate.wall,
          snapPosition: closestCandidate.snapPosition,
          distance: closestCandidate.distance,
          face: closestCandidate.face,
        };
      }

      return null;
    },
    [wallsData, enableWallMagnet, getSelectionBoxSize]
  );

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
          startDrag(modelId, {
            x: currentModel.position[0],
            y: currentModel.position[1],
            z: currentModel.position[2],
          });
        }

        gl.domElement.style.cursor = "grabbing";
      }
    },
    [
      modelId,
      onSelect,
      camera,
      gl,
      raycaster,
      mouse,
      controlsRef,
      loadedModels,
      startDrag,
      isModelLocked,
    ]
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

          // 벽 자석 기능 적용
          const wallSnap = findNearestWallSnap(newPosition);
          const finalPosition = wallSnap ? wallSnap.snapPosition : newPosition;

          // 벽에 스냅되었는지 상태 업데이트
          const wasSnapped = isSnappedToWall;
          const isNowSnapped = !!wallSnap;
          setIsSnappedToWall(isNowSnapped);

          // 스냅된 벽 정보 업데이트
          setSnappedWallInfo(wallSnap);

          // 스냅 상태가 변경되었을 때 시각적/햅틱 피드백
          if (!wasSnapped && isNowSnapped) {
            // 벽에 스냅됨 - 커서 변경 또는 다른 피드백
            gl.domElement.style.cursor = "grabbing";
          } else if (wasSnapped && !isNowSnapped) {
            // 벽에서 해제됨
            gl.domElement.style.cursor = "grabbing";
          }

          onPositionChange(
            modelId,
            [finalPosition.x, finalPosition.y, finalPosition.z],
            true,
            true
          ); // shouldBroadcast=true, isDragging=true
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
      findNearestWallSnap,
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
        {
          x: currentModel.position[0],
          y: currentModel.position[1],
          z: currentModel.position[2],
        },
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
    setIsSnappedToWall(false); // 드래그 완료 시 스냅 상태 해제
    setSnappedWallInfo(null); // 스냅된 벽 정보도 초기화
    gl.domElement.style.cursor = "auto";

    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }
  }, [
    isDragging,
    isScaling,
    modelId,
    loadedModels,
    endDragMove,
    endDragScale,
    gl,
    controlsRef,
  ]);

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

  // 현재 스냅된 벽 정보 저장
  const [snappedWallInfo, setSnappedWallInfo] = useState(null);

  return {
    isDragging,
    isScaling,
    isSnappedToWall,
    snappedWallInfo,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerOver,
    handlePointerOut,
  };
}
