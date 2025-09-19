export const collaborationSlice = (set, get) => ({
  // ===== 동시편집(실시간 협업) 관련 상태 =====
  collaborationMode: false, // 동시편집 모드 활성화 여부
  isConnected: false, // WebSocket 연결 상태
  connectedUsers: new Map(), // 접속중인 다른 사용자들
  currentUser: {
    id: null,
    name: null,
    color: "#3B82F6", // 사용자별 구분 색상
  },

  // 채팅 포커스 상태 관리
  isChatFocused: false,
  setIsChatFocused: (focused) => set({ isChatFocused: focused }),

  // 협업 모드용 브로드캐스트 콜백들
  collaborationCallbacks: {
    broadcastModelAdd: null,
    broadcastModelAddWithId: null,
    broadcastModelRemove: null,
    broadcastModelMove: null,
    broadcastModelRotate: null,
    broadcastModelScale: null,
    broadcastWallAdd: null,
    broadcastWallAddWithId: null,
    broadcastWallRemove: null,
    broadcastWallColorChange: null,
    broadcastFloorColorChange: null,
    broadcastBackgroundColorChange: null,
    broadcastEnvironmentPresetChange: null,
    broadcastWallTextureChange: null,
    broadcastFloorTextureChange: null,
    broadcastUseOriginalTextureChange: null,
    broadcastUseOriginalWallTextureChange: null,
  },

  // 쓰로틀링 관리 객체
  _throttledBroadcasts: {},

  // 동시편집 모드 토글
  setCollaborationMode: (enabled) => set({ collaborationMode: enabled }),

  // WebSocket 연결 상태 관리
  setConnectionStatus: (connected) => set({ isConnected: connected }),

  // 현재 사용자 정보 설정
  setCurrentUser: (user) => set({ currentUser: user }),

  // 다른 사용자 정보 업데이트 (커서 위치, 선택한 모델 등)
  updateConnectedUser: (userId, userData) =>
    set((state) => {
      const newUsers = new Map(state.connectedUsers);
      const existingData = newUsers.get(userId) || {};
      newUsers.set(userId, { ...existingData, ...userData });
      console.log("👥 Updated connected user:", userId, {
        ...existingData,
        ...userData,
      });
      return { connectedUsers: newUsers };
    }),

  // 사용자 연결 해제시 목록에서 제거
  removeConnectedUser: (userId) =>
    set((state) => {
      const newUsers = new Map(state.connectedUsers);
      newUsers.delete(userId);
      return { connectedUsers: newUsers };
    }),

  // 모든 연결된 사용자 목록 초기화
  clearConnectedUsers: () => set({ connectedUsers: new Map() }),

  // 협업 훅에서 브로드캐스트 함수들을 등록
  setCollaborationCallbacks: (callbacks) =>
    set({ collaborationCallbacks: callbacks }),

  // 통합 브로드캐스트 관리 함수
  broadcastWithThrottle: (eventType, modelId, data, throttleMs = 30) => {
    const state = get();

    if (
      !state.collaborationMode ||
      !state.collaborationCallbacks[eventType]
    ) {
      return;
    }

    const throttleKey = `${eventType}_${modelId}`;

    // 기존 타이머 클리어
    if (state._throttledBroadcasts[throttleKey]) {
      clearTimeout(state._throttledBroadcasts[throttleKey]);
    }

    // 새 타이머 설정
    state._throttledBroadcasts[throttleKey] = setTimeout(() => {
      const currentState = get();
      if (currentState.collaborationCallbacks[eventType]) {
        // 이벤트 타입에 따라 다른 파라미터 전달 방식 사용
        if (eventType.includes("ModelAdd")) {
          // 모델 추가의 경우 modelData만 전달
          currentState.collaborationCallbacks[eventType](data);
        } else if (eventType.includes("ModelRemove")) {
          // 모델 제거의 경우 modelId만 전달
          currentState.collaborationCallbacks[eventType](modelId);
        } else if (eventType.includes("WallAdd")) {
          // 벽 추가의 경우 wallData만 전달
          currentState.collaborationCallbacks[eventType](data);
        } else if (eventType.includes("WallRemove")) {
          // 벽 제거의 경우 wallId만 전달
          currentState.collaborationCallbacks[eventType](modelId);
        } else if (eventType.includes("TextureChange") || eventType.includes("ColorChange") || eventType.includes("EnvironmentPreset")) {
          // 색상/텍스처/환경 변경의 경우 data만 전달
          currentState.collaborationCallbacks[eventType](data);
        } else {
          // 이동, 회전, 스케일의 경우 modelId와 data 전달
          currentState.collaborationCallbacks[eventType](modelId, data);
        }
      }
      delete currentState._throttledBroadcasts[throttleKey];
    }, throttleMs);

    set({ _throttledBroadcasts: state._throttledBroadcasts });
  },

  // 🔒 락 체크 헬퍼 함수
  isModelLocked: (modelId) => {
    const state = get();
    return Array.from(state.connectedUsers.entries()).some(
      ([userId, userData]) =>
        userData.selectedModelId === modelId &&
        userId !== state.currentUser.id
    );
  },
});