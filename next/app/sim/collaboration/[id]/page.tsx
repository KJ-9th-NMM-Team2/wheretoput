"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/components/sim/useStore.js";
import { SimulatorCore } from "@/components/sim/SimulatorCore";
import { ConnectedUsersList } from "@/components/sim/collaboration/CollaborationIndicators.jsx";
import { useCollaboration } from "@/components/sim/collaboration/useCollaboration.js";
import { HistoryProvider } from "@/components/sim/history";
import { connectSocket, getSocket } from "@/lib/client/socket";
import { useSession } from "next-auth/react";

function CollaborationPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { setCollaborationMode, setViewOnly, setCurrentUser } = useStore();

  const [roomId, setRoomId] = useState<string | null>(null);
  const { data: session } = useSession();

  // 협업 모드 초기 설정
  useEffect(() => {
    setViewOnly(false); // 편집 가능
    setCollaborationMode(true); // 협업 모드 활성화

    // 현재 사용자 정보 설정 (임시로 랜덤 ID 생성)
    setCurrentUser({
      id: session?.user.id || `user_${Math.floor(Math.random() * 10000)}`,
      name: session?.user.name || `Guest_${Math.floor(Math.random() * 1000)}`,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    });
  }, [setViewOnly, setCollaborationMode, setCurrentUser]);

  // 협업 훅 활성화
  const collaboration = useCollaboration(roomId);

  // URL 파라미터에서 room_id 추출
  useEffect(() => {
    const initializeCollaboration = async () => {
      try {
        const resolvedParams = await params;
        const currentRoomId = resolvedParams.id;

        console.log(`협업 모드 시뮬레이터 초기화: room_id = ${currentRoomId}`);
        setRoomId(currentRoomId);
      } catch (error) {
        console.error("협업 모드 시뮬레이터 초기화 실패:", error);
      }
    };

    initializeCollaboration();
  }, [params]);

  if (!roomId) {
    return <div>Loading...</div>;
  }

  // socket 통신 테스트 해보던거 아직 정확한 작동 X
  // useEffect(() => {
  //   let alive = true;

  //   const initSocketAndJoinRoom = async () => {
  //     try {
  //       // 1. 토큰 가져오기
  //       const r = await fetch("/api/chat/token", { cache: "no-store" });
  //       if (!r.ok) {
  //         console.error("token status", r.status);
  //         return;
  //       }

  //       const data = await r.json();
  //       const token = data.token;
  //       if (!alive || !token) return;

  //       // 2. 소켓 연결
  //       const socket = connectSocket(token);

  //       socket.emit('socketConnect', { roomId });

  //       // 3. 연결 대기
  //       socket.on('connect', () => {
  //         console.log('Socket connected, joining room:', roomId);
  //         socket.emit('joinRoom', { roomId });
  //       });

  //       // 4. 이벤트 리스너 등록
  //       socket.on('userJoined', (data) => {
  //         console.log(`사용자 입장:`, data);
  //       });

  //       socket.on('furnitureUpdated', (data) => {
  //         console.log('가구 업데이트:', data);
  //       });

  //       // 이미 연결되어 있다면 바로 방 입장
  //       if (socket.connected) {
  //         socket.emit('joinRoom', { roomId });
  //       }

  //     } catch (e) {
  //       console.error("Socket init error:", e);
  //     }
  //   };

  //   initSocketAndJoinRoom();

  //   return () => {
  //     alive = false;
  //     // 소켓 정리
  //     const socket = getSocket();
  //     if (socket) {
  //       socket.emit('leaveRoom', { roomId });
  //       socket.off('userJoined');
  //       socket.off('furnitureUpdated');
  //       socket.off('connect');
  //       socket.disconnect();
  //     }
  //   };
  // }, [roomId]);

  return (
    <SimulatorCore
      roomId={roomId}
      showSidebar={true}
      showModeControls={false} // 모드 컨트롤은 숨김 (이미 협업 모드)
      showEditControls={true}
      additionalUI={
        <>
          <ConnectedUsersList />
        </>
      }
      loadingMessage="협업 모드 로딩 중..."
      loadingIcon="🤝"
    />
  );
}

export default function CollaborationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <HistoryProvider>
      <CollaborationPageContent params={params} />
    </HistoryProvider>
  );
}
