export const wallSlice = (set, get) => ({
  //[09.01] wallscalefactor 로 벽 조정 가능합니다.
  wallsData: [],
  wallScaleFactor: 1.0, // 벽 크기 조정 팩터

  // 벽 도구 모드 관리
  wallToolMode: null, // 'add', 'edit', 'delete', null
  wallDrawingStart: null, // 벽 그리기 시작점
  selectedWallId: null, // 선택된 벽 ID

  // 벽 자석 기능 토글
  enableWallMagnet: true,
  setEnableWallMagnet: (enable) => set({ enableWallMagnet: enable }),

  // 벽 자석 시각적 효과용 상태
  snappedWallInfo: null,
  setSnappedWallInfo: (wallInfo) => set({ snappedWallInfo: wallInfo }),

  // 저장/로드 액션
  setWallsData: (walls) => set({ wallsData: walls }),
  setWallScaleFactor: (factor) => set({ wallScaleFactor: factor }),

  // 벽 도구 모드 관련 액션
  setWallToolMode: (mode) =>
    set({
      wallToolMode: mode,
      wallDrawingStart: null,
      selectedWallId: null,
    }),
  setWallDrawingStart: (point) => set({ wallDrawingStart: point }),
  setSelectedWallId: (wallId) => set({ selectedWallId: wallId }),

  // 히스토리 복원용: 기존 ID를 유지하면서 벽 추가 (히스토리 액션 추가 안함)
  addWallWithId: (wallData, shouldBroadcast = true) =>
    set((state) => {
      console.log("🔧 addWallWithId 호출:", {
        wallId: wallData.id,
        currentWallCount: state.wallsData.length,
        existingWallIds: state.wallsData.map((w) => w.id),
        shouldBroadcast,
      });

      // 같은 ID의 기존 벽 제거 (중복 방지)
      const filteredWalls = state.wallsData.filter(
        (wall) => wall.id !== wallData.id
      );

      console.log("🔧 필터링 후:", {
        removedCount: state.wallsData.length - filteredWalls.length,
        remainingWalls: filteredWalls.length,
      });

      // Socket 브로드캐스트 (협업 모드이고 브로드캐스트가 필요한 경우)
      if (shouldBroadcast) {
        get().broadcastWithThrottle(
          "broadcastWallAddWithId",
          wallData.id,
          wallData,
          0
        );
      }

      const newWallsData = [...filteredWalls, wallData];
      console.log("🔧 최종 결과:", {
        finalWallCount: newWallsData.length,
        addedWallId: wallData.id,
      });

      return {
        wallsData: newWallsData,
      };
    }),

  // 벽 추가 액션 (스냅 기능 포함)
  addWall: (startPoint, endPoint, id = null, shouldBroadcast = true) =>
    set((state) => {
      // 벽 스냅 기능 적용
      let snappedStart = startPoint;
      let snappedEnd = endPoint;

      if (state.wallsData.length > 0) {
        // 기존 벽의 끝점에 스냅
        const snapDistance = 0.5;

        // 시작점 스냅
        let closestStartPoint = null;
        let minStartDistance = snapDistance;

        state.wallsData.forEach((wall) => {
          const { position, rotation, dimensions } = wall;
          const halfWidth = dimensions.width / 2;
          const cos = Math.cos(rotation[1]);
          const sin = Math.sin(rotation[1]);

          const endpoints = [
            [
              position[0] - halfWidth * cos,
              position[1],
              position[2] + halfWidth * sin, // sin 부호 변경
            ],
            [
              position[0] + halfWidth * cos,
              position[1],
              position[2] - halfWidth * sin, // sin 부호 변경
            ],
          ];

          endpoints.forEach((endpoint) => {
            const distance = Math.sqrt(
              Math.pow(startPoint[0] - endpoint[0], 2) +
                Math.pow(startPoint[2] - endpoint[2], 2)
            );
            if (distance < minStartDistance) {
              minStartDistance = distance;
              closestStartPoint = endpoint;
            }
          });
        });

        if (closestStartPoint) {
          snappedStart = closestStartPoint;
        }

        // 끝점 스냅
        let closestEndPoint = null;
        let minEndDistance = snapDistance;

        state.wallsData.forEach((wall) => {
          const { position, rotation, dimensions } = wall;
          const halfWidth = dimensions.width / 2;
          const cos = Math.cos(rotation[1]);
          const sin = Math.sin(rotation[1]);

          const endpoints = [
            [
              position[0] - halfWidth * cos,
              position[1],
              position[2] + halfWidth * sin, // sin 부호 변경
            ],
            [
              position[0] + halfWidth * cos,
              position[1],
              position[2] - halfWidth * sin, // sin 부호 변경
            ],
          ];

          endpoints.forEach((endpoint) => {
            const distance = Math.sqrt(
              Math.pow(endPoint[0] - endpoint[0], 2) +
                Math.pow(endPoint[2] - endpoint[2], 2)
            );
            if (distance < minEndDistance) {
              minEndDistance = distance;
              closestEndPoint = endpoint;
            }
          });
        });

        if (closestEndPoint) {
          snappedEnd = closestEndPoint;
        }
      }

      // 벽의 방향 벡터 계산 (스냅된 좌표 사용)
      const dx = snappedEnd[0] - snappedStart[0];
      const dz = snappedEnd[2] - snappedStart[2];

      // 벽의 길이 계산
      const wallLength = Math.sqrt(dx * dx + dz * dz);

      // 너무 짧은 벽은 생성하지 않음
      if (wallLength < 0.1) {
        console.warn("벽이 너무 짧습니다.");
        return state;
      }

      // Y축 회전각 계산
      const rotationY = Math.atan2(-dz, dx);

      const newWall = {
        id: id || `wall-${crypto.randomUUID()}`,
        position: [
          (snappedStart[0] + snappedEnd[0]) / 2, // 중점 X
          state.wallsData[0]?.position[1] || 2.5, // 기존 벽 높이나 기본값
          (snappedStart[2] + snappedEnd[2]) / 2, // 중점 Z
        ],
        rotation: [
          0,
          rotationY, // 올바른 Y축 회전각
          0,
        ],
        dimensions: {
          width: wallLength, // 계산된 길이 사용
          height: 2.5, // 기존 벽 높이 사용
          depth: 0.15,
        },
      };

      // console.log('벽 추가:', newWall);

      // shouldBroadcast가 true인 경우에만 히스토리 액션 추가 (사용자 액션)
      if (shouldBroadcast && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("addHistoryAction", {
            detail: {
              type: "WALL_ADD",
              data: {
                furnitureId: newWall.id,
                previousData: newWall,
              },
              description: "벽 추가",
            },
          })
        );
      }

      // Socket 브로드캐스트 (협업 모드이고 브로드캐스트가 필요한 경우)
      if (shouldBroadcast) {
        get().broadcastWithThrottle("broadcastWallAdd", newWall.id, newWall, 0);
      }

      return {
        wallsData: [...state.wallsData, newWall],
        wallDrawingStart: null, // 벽 추가 후 시작점 초기화
      };
    }),

  // 벽 삭제 액션
  removeWall: (wallId, shouldBroadcast = true, shouldAddHistory = true) =>
    set((state) => {
      console.log("삭제할 벽의 id:", wallId);
      console.log("현재 벽들의 id:", state.wallsData);
      const wallToRemove = state.wallsData.find((wall) => wall.id === wallId);

      if (wallToRemove) {
        // 히스토리 액션 추가 (사용자 액션이고 shouldAddHistory가 true인 경우에만)
        if (shouldAddHistory && typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("addHistoryAction", {
              detail: {
                type: "WALL_REMOVE",
                data: {
                  furnitureId: wallId,
                  previousData: wallToRemove,
                },
                description: "벽 삭제",
              },
            })
          );
        }

        // Socket 브로드캐스트 (협업 모드이고 브로드캐스트가 필요한 경우)
        if (shouldBroadcast) {
          get().broadcastWithThrottle("broadcastWallRemove", wallId, null, 0);
        }
      }

      return {
        wallsData: state.wallsData.filter((wall) => wall.id !== wallId),
        selectedWallId: null,
      };
    }),

  // 벽 업데이트 액션
  updateWall: (wallId, updates, shouldBroadcast = true) =>
    set((state) => {
      // Socket 브로드캐스트 (협업 모드이고 브로드캐스트가 필요한 경우)
      if (shouldBroadcast) {
        get().broadcastWithThrottle("broadcastWallUpdate", wallId, updates, 30);
      }

      return {
        wallsData: state.wallsData.map((wall) =>
          wall.id === wallId ? { ...wall, ...updates } : wall
        ),
      };
    }),
});
