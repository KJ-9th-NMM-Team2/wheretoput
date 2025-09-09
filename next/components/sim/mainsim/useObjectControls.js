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

  // 벽 자석 기능 - OBB 기준으로 가장 가까운 벽까지의 거리와 스냅 위치 계산
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

      const SNAP_DISTANCE = 0.3; // 30cm 이내에서 자석 효과 발동
      const WALL_OFFSET = 0.05; // 벽에서 5cm 떨어진 위치에 스냅

      // 원본 크기 정보를 geometry에서 직접 가져와서 OBB 계산에 사용
      let originalWidth, originalHeight, originalDepth;
      try {
        if (meshRef.current) {
          // rotation을 임시로 0으로 설정하여 원본 크기 계산
          const originalRotation = meshRef.current.rotation.clone();
          meshRef.current.rotation.set(0, 0, 0);

          const bbox = new THREE.Box3().setFromObject(meshRef.current);
          const size = bbox.getSize(new THREE.Vector3());
          originalWidth = size.x;
          originalHeight = size.y;
          originalDepth = size.z;

          // 원래 rotation으로 복원
          meshRef.current.rotation.copy(originalRotation);
        } else {
          // fallback으로 SelectionBox 사용
          [originalWidth, originalHeight, originalDepth] =
            getSelectionBoxSize();
        }
      } catch (error) {
        console.warn("Failed to get original size:", error);
        return null;
      }

      const furnitureHalfWidth = originalWidth / 2;
      const furnitureHalfDepth = originalDepth / 2;

      // 가구의 현재 회전각 가져오기 - 파라미터로 받은 rotation 우선 사용
      const furnitureRotationY =
        rotation?.y || meshRef.current?.rotation?.y || 0;

      // 모든 벽의 모든 면에 대한 후보들을 수집
      const allCandidates = [];

      // 이제 회전을 고려한 OBB 기반 계산 수행

      // 각 벽에 대해 회전을 고려한 거리 계산
      wallsData.forEach((wall) => {
        const wallPos = new THREE.Vector3(...wall.position);
        const wallRotation = wall.rotation[1]; // Y축 회전각
        const wallWidth = wall.dimensions.width;
        const wallDepth = wall.dimensions.depth;
        const wallHalfWidth = wallWidth / 2;
        const wallHalfDepth = wallDepth / 2;

        // 벽의 로컬 좌표계 변환 행렬
        const wallCos = Math.cos(wallRotation);
        const wallSin = Math.sin(wallRotation);

        // 가구를 벽의 로컬 좌표계로 변환
        const relativePos = new THREE.Vector3(
          position.x - wallPos.x,
          0,
          position.z - wallPos.z
        );

        // 벽의 로컬 좌표계로 변환
        const localX = relativePos.x * wallCos + relativePos.z * wallSin;
        const localZ = -relativePos.x * wallSin + relativePos.z * wallCos;

        // 가구의 회전을 벽의 로컬 좌표계에서 계산
        const relativeRotation = furnitureRotationY - wallRotation;
        const furnitureCos = Math.cos(relativeRotation);
        const furnitureSin = Math.sin(relativeRotation);

        // 회전된 가구의 실제 바운딩 박스 크기 (벽의 로컬 좌표계에서)
        const rotatedFurnitureWidth =
          Math.abs(furnitureHalfWidth * furnitureCos) +
          Math.abs(furnitureHalfDepth * furnitureSin);
        const rotatedFurnitureDepth =
          Math.abs(furnitureHalfWidth * furnitureSin) +
          Math.abs(furnitureHalfDepth * furnitureCos);

        // Z축 방향 (벽의 앞뒤) 스냅 계산
        if (Math.abs(localX) <= wallHalfWidth + rotatedFurnitureWidth) {
          // 벽 앞면 스냅
          const furnitureBackEdge = localZ - rotatedFurnitureDepth;
          const wallFrontEdge = wallHalfDepth;
          const frontDistance = Math.abs(furnitureBackEdge - wallFrontEdge);

          if (
            furnitureBackEdge > wallFrontEdge &&
            frontDistance < SNAP_DISTANCE
          ) {
            const snapLocalZ =
              wallFrontEdge + WALL_OFFSET + rotatedFurnitureDepth;
            const snapWorldPos = {
              x: wallPos.x + (localX * wallCos - snapLocalZ * wallSin),
              y: position.y,
              z: wallPos.z + (localX * wallSin + snapLocalZ * wallCos),
            };

            allCandidates.push({
              distance: frontDistance,
              snapPosition: snapWorldPos,
              wall: wall,
              face: "front",
            });
          }

          // 벽 뒷면 스냅
          const furnitureFrontEdge = localZ + rotatedFurnitureDepth;
          const wallBackEdge = -wallHalfDepth;
          const backDistance = Math.abs(furnitureFrontEdge - wallBackEdge);

          if (
            furnitureFrontEdge < wallBackEdge &&
            backDistance < SNAP_DISTANCE
          ) {
            const snapLocalZ =
              wallBackEdge - WALL_OFFSET - rotatedFurnitureDepth;
            const snapWorldPos = {
              x: wallPos.x + (localX * wallCos - snapLocalZ * wallSin),
              y: position.y,
              z: wallPos.z + (localX * wallSin + snapLocalZ * wallCos),
            };

            allCandidates.push({
              distance: backDistance,
              snapPosition: snapWorldPos,
              wall: wall,
              face: "back",
            });
          }
        }

        // X축 방향 (벽의 좌우) 스냅 계산
        if (Math.abs(localZ) <= wallHalfDepth + rotatedFurnitureDepth) {
          // 벽 오른쪽 스냅
          const furnitureLeftEdge = localX - rotatedFurnitureWidth;
          const wallRightEdge = wallHalfWidth;
          const rightDistance = Math.abs(furnitureLeftEdge - wallRightEdge);

          if (
            furnitureLeftEdge > wallRightEdge &&
            rightDistance < SNAP_DISTANCE
          ) {
            const snapLocalX =
              wallRightEdge + WALL_OFFSET + rotatedFurnitureWidth;
            const snapWorldPos = {
              x: wallPos.x + (snapLocalX * wallCos - localZ * wallSin),
              y: position.y,
              z: wallPos.z + (snapLocalX * wallSin + localZ * wallCos),
            };

            allCandidates.push({
              distance: rightDistance,
              snapPosition: snapWorldPos,
              wall: wall,
              face: "right",
            });
          }

          // 벽 왼쪽 스냅
          const furnitureRightEdge = localX + rotatedFurnitureWidth;
          const wallLeftEdge = -wallHalfWidth;
          const leftDistance = Math.abs(furnitureRightEdge - wallLeftEdge);

          if (
            furnitureRightEdge < wallLeftEdge &&
            leftDistance < SNAP_DISTANCE
          ) {
            const snapLocalX =
              wallLeftEdge - WALL_OFFSET - rotatedFurnitureWidth;
            const snapWorldPos = {
              x: wallPos.x + (snapLocalX * wallCos - localZ * wallSin),
              y: position.y,
              z: wallPos.z + (snapLocalX * wallSin + localZ * wallCos),
            };

            allCandidates.push({
              distance: leftDistance,
              snapPosition: snapWorldPos,
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

          // 벽 자석 기능 적용 - useStore에서 현재 모델의 rotation 정보 가져오기
          const currentModel = loadedModels.find(
            (model) => model.id === modelId
          );
          const currentRotation = currentModel?.rotation
            ? { y: currentModel.rotation[1] }
            : meshRef?.current?.rotation;
          console.log("현재 회전각도: ", currentRotation);
          const wallSnap = findNearestWallSnap(newPosition, currentRotation);
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
      meshRef,
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
