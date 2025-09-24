import { useState, useCallback, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { on } from "events";
import { useStore } from "@/components/sim/useStore";
import { useHistoryDrag } from "@/components/sim/history/useHistoryDrag";

// 쓰로틀링 헬퍼 함수
const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  return function (...args) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

export function useObjectControls(
  modelId,
  onPositionChange,
  onRotationChange,
  onScaleChange,
  onSelect,
  onHover,
  controlsRef,
  getSelectionBoxSize,
  meshRef,
  needsRotation
) {
  const { camera, gl, raycaster, mouse } = useThree();
  const {
    loadedModels,
    isModelLocked,
    wallsData,
    enableWallMagnet,
    wallToolMode,
  } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const [dragOffset, setDragOffset] = useState(new THREE.Vector3());
  const [initialMouseY, setInitialMouseY] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const [isSnappedToWall, setIsSnappedToWall] = useState(false);
  // 현재 스냅된 벽 정보 저장
  const [snappedWallInfo, setSnappedWallInfo] = useState(null);

  // 히스토리 기능
  const { startDrag, endDragMove, endDragScale } = useHistoryDrag();

  // 이전 값들을 저장하여 실제 변경시에만 업데이트
  const prevSnappedRef = useRef(false);
  const prevWallInfoRef = useRef(null);
  const prevPositionRef = useRef(null);

  // 벽 자석 기능 - OBB 기준으로 가장 가까운 벽까지의 거리와 스냅 위치 계산
  const findNearestWallSnap = useCallback(
    (position, rotation) => {
      // useStore에서 최신 wallsData를 직접 가져오기 (의존성 문제 해결)
      const currentWallsData = useStore.getState().wallsData;

      if (
        !enableWallMagnet ||
        !currentWallsData ||
        currentWallsData.length === 0 ||
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

          // needsRotation이 true일 때 원본 크기에서 x와 z를 바꿔서 사용
          if (needsRotation) {
            originalWidth = size.z;
            originalHeight = size.y;
            originalDepth = size.x;
          } else {
            originalWidth = size.x;
            originalHeight = size.y;
            originalDepth = size.z;
          }

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

      // 가구의 현재 회전각 가져오기 - 이미 총 회전각이 전달됨
      const furnitureRotationY =
        rotation?.y || meshRef.current?.rotation?.y || 0;

      // 모든 벽의 모든 면에 대한 후보들을 수집
      const allCandidates = [];

      // 이제 회전을 고려한 OBB 기반 계산 수행

      // 각 벽에 대해 회전을 고려한 거리 계산
      currentWallsData.forEach((wall) => {
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

      // 코너 스냅 기능: 두 벽에 동시에 스냅 가능한지 확인
      const CORNER_SNAP_DISTANCE = 0.5; // 코너 스냅을 위한 더 큰 거리 (더 강한 자석 효과)

      // 가까운 후보들만 필터링 (코너 스냅용) - 이미 스냅된 상태에서도 다른 벽을 감지할 수 있도록 거리 조건을 완화
      const nearCandidates = allCandidates.filter(
        (candidate) => candidate.distance < CORNER_SNAP_DISTANCE
      );

      // 현재 스냅된 벽이 있다면 우선적으로 고려 (이미 스냅된 상태에서 코너 스냅 감지 향상)
      const currentlySnapped = allCandidates.filter(
        (candidate) => candidate.distance < 0.05
      );

      // 두 개 이상의 가까운 벽이 있을 때 코너 스냅 시도 (현재 스냅된 벽 포함)
      // O(n) deduplication using a Set for wall-face pairs
      const seenWallFace = new Set();
      const candidatesForCorner = [];
      for (const candidate of [...currentlySnapped, ...nearCandidates]) {
        // Use wall.id if available, otherwise fallback to wall reference
        const wallId =
          candidate.wall && candidate.wall.id !== undefined
            ? candidate.wall.id
            : candidate.wall;
        const key = `${wallId}:${candidate.face}`;
        if (!seenWallFace.has(key)) {
          seenWallFace.add(key);
          candidatesForCorner.push(candidate);
        }
      }

      if (candidatesForCorner.length >= 2) {
        // 각 벽 조합을 확인하여 직각인지 체크
        for (let i = 0; i < candidatesForCorner.length; i++) {
          for (let j = i + 1; j < candidatesForCorner.length; j++) {
            const wall1 = candidatesForCorner[i].wall;
            const wall2 = candidatesForCorner[j].wall;

            // 두 벽의 회전각 차이가 90도(π/2) 근처인지 확인 (평행 벽 제외)
            const angleDiff = Math.abs(wall1.rotation[1] - wall2.rotation[1]);
            const normalizedDiff = angleDiff % (2 * Math.PI); // 2π로 정규화
            const isRightAngle =
              Math.abs(normalizedDiff - Math.PI / 2) < 0.1 ||
              Math.abs(normalizedDiff - (3 * Math.PI) / 2) < 0.1;

            if (isRightAngle) {
              const candidate1 = candidatesForCorner[i];
              const candidate2 = candidatesForCorner[j];

              // 벽의 회전을 고려하여 실제 월드 축 제약을 계산
              const getWorldAxisConstraint = (candidate) => {
                const wallRotation = candidate.wall.rotation[1];
                const face = candidate.face;

                // 벽의 회전각을 고려하여 실제 월드 축에서 어떤 제약인지 판단
                const normalizedRotation =
                  ((wallRotation % (2 * Math.PI)) + 2 * Math.PI) %
                  (2 * Math.PI);

                // 벽이 X축 방향 (0도 또는 180도)인 경우
                const isWallXAligned =
                  Math.abs(normalizedRotation) < 0.1 ||
                  Math.abs(normalizedRotation - Math.PI) < 0.1;

                if (isWallXAligned) {
                  // X축 정렬된 벽: front/back이 Z축 제약, left/right이 X축 제약
                  return face === "front" || face === "back" ? "Z" : "X";
                } else {
                  // Z축 정렬된 벽 (90도 또는 270도): front/back이 X축 제약, left/right이 Z축 제약
                  return face === "front" || face === "back" ? "X" : "Z";
                }
              };

              const candidate1Axis = getWorldAxisConstraint(candidate1);
              const candidate2Axis = getWorldAxisConstraint(candidate2);

              // 같은 축을 제약하는 경우는 코너 스냅이 아님 (스킵)
              if (candidate1Axis === candidate2Axis) {
                continue;
              }

              // 단순화된 코너 위치 계산: 두 개별 스냅 위치를 조합
              const calculateCornerPosition = () => {
                let cornerX, cornerZ;

                // X축 제약을 가진 후보에서 X 좌표를 가져옴
                if (candidate1Axis === "X") {
                  cornerX = candidate1.snapPosition.x;
                  cornerZ = candidate2.snapPosition.z;
                } else {
                  cornerX = candidate2.snapPosition.x;
                  cornerZ = candidate1.snapPosition.z;
                }

                return { x: cornerX, z: cornerZ };
              };

              const { x: cornerX, z: cornerZ } = calculateCornerPosition();

              const cornerPosition = {
                x: cornerX,
                y: position.y,
                z: cornerZ,
              };

              // 코너 위치에서의 거리 계산
              const cornerDistance = Math.sqrt(
                Math.pow(cornerPosition.x - position.x, 2) +
                  Math.pow(cornerPosition.z - position.z, 2)
              );

              // 코너 스냅 거리를 더 크게 해서 자석 효과 강화
              // 이미 한 벽에 스냅된 상태에서도 코너 스냅이 가능하도록 거리 조건을 완화
              const isAlreadySnapped =
                candidate1.distance < 0.01 || candidate2.distance < 0.01;
              const effectiveCornerDistance = isAlreadySnapped
                ? CORNER_SNAP_DISTANCE * 1.5
                : CORNER_SNAP_DISTANCE;

              if (cornerDistance < effectiveCornerDistance) {
                return {
                  wall: wall1, // 주 벽
                  wall2: wall2, // 보조 벽
                  snapPosition: cornerPosition,
                  distance: 0, // 코너 스냅은 최우선으로 처리 (거리를 0으로 설정)
                  face: "corner",
                  isCornerSnap: true,
                };
              }
            }
          }
        }
      }

      // 코너 스냅이 없다면 기존 로직으로 가장 가까운 면 선택
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
    [enableWallMagnet, getSelectionBoxSize]
  );

  const handlePointerDown = useCallback(
    (e) => {
      e.stopPropagation();

      // 벽 추가 모드일 때는 가구 클릭 무시
      if (wallToolMode === "add") {
        return;
      }

      // 🔒 락 체크 - 맨 처음에!
      if (isModelLocked(modelId)) {
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
      wallToolMode,
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
          const baseRotationY = currentModel?.rotation
            ? currentModel.rotation[1]
            : meshRef?.current?.rotation?.y || 0;
          // 사전회전 + 사용자 회전을 포함한 총 회전각 계산
          const totalRotationY =
            baseRotationY + (needsRotation ? (Math.PI * 3) / 2 : 0);
          const currentRotation = { y: totalRotationY };
          const wallSnap = findNearestWallSnap(newPosition, currentRotation);

          // 코너 스냅일 때는 완전히 독립적인 위치 계산, 일반 스냅일 때는 제약된 이동 허용
          let finalPosition;
          if (wallSnap?.isCornerSnap) {
            // 코너 스냅: 두 벽에 딱 맞는 코너 위치로
            finalPosition = wallSnap.snapPosition;
          } else if (wallSnap) {
            // 일반 벽 스냅: 한 축만 제약
            finalPosition = wallSnap.snapPosition;
          } else {
            // 스냅 없음: 자유 이동
            finalPosition = newPosition;
          }

          // 벽에 스냅되었는지 상태 업데이트 (쓰로틀링 적용)
          const wasSnapped = isSnappedToWall;
          const isNowSnapped = !!wallSnap;

          // 실제 변경시에만 상태 업데이트 (무한 루프 방지)
          if (prevSnappedRef.current !== isNowSnapped) {
            setIsSnappedToWall(isNowSnapped);
            prevSnappedRef.current = isNowSnapped;
          }

          const wallSnapString = JSON.stringify(wallSnap);
          const prevWallSnapString = JSON.stringify(prevWallInfoRef.current);
          if (wallSnapString !== prevWallSnapString) {
            setSnappedWallInfo(wallSnap);
            prevWallInfoRef.current = wallSnap;
          }

          // 스냅 상태가 변경되었을 때 시각적/햅틱 피드백
          if (!wasSnapped && isNowSnapped) {
            // 벽에 스냅됨 - 코너 스냅인지 확인
            if (wallSnap.isCornerSnap) {
              gl.domElement.style.cursor = "crosshair"; // 코너 스냅 시 특별한 커서
            } else {
              gl.domElement.style.cursor = "grabbing";
            }
          } else if (wasSnapped && !isNowSnapped) {
            // 벽에서 해제됨
            gl.domElement.style.cursor = "grabbing";
          }

          // 위치가 실제 변경되었을 때만 업데이트 (더 엄격한 조건)
          const newPos = [finalPosition.x, finalPosition.y, finalPosition.z];
          const prevPos = prevPositionRef.current;
          const hasPositionChanged = !prevPos || newPos.some((val, idx) =>
            Math.abs(val - prevPos[idx]) > 0.01 // 1cm 이상 차이날 때만
          );

          if (hasPositionChanged) {
            onPositionChange(modelId, newPos, true, true);
            prevPositionRef.current = newPos;
          }
        }
      } else if (isScaling) {
        const deltaY = (initialMouseY - e.clientY) * 0.01;
        const newScale = Math.max(0.1, Math.min(3, initialScale + deltaY));
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
