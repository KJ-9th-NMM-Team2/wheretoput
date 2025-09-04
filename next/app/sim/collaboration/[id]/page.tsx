"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/components/sim/useStore.js";
import { SimulatorCore } from "@/components/sim/SimulatorCore";
import {
  CollaborativeCursors,
  ConnectedUsersList,
  CollaborativeSelectionHighlight,
} from "@/components/sim/collaboration/CollaborationIndicators.jsx";
import { useCollaboration } from "@/components/sim/collaboration/useCollaboration.js";
import { HistoryProvider } from "@/components/sim/history";

// 협업 모드 헤더 컴포넌트
function CollaborationHeader({ roomId }: { roomId: string }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(245, 158, 11, 0.9)", // 협업 모드 색상
        padding: "12px 20px",
        borderRadius: "8px",
        zIndex: 100,
        color: "white",
        fontSize: "14px",
        fontWeight: "bold",
        textAlign: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span>🤝</span>
        <span>협업 모드</span>
        <span style={{ fontSize: "12px", opacity: 0.8 }}>Room: {roomId}</span>
      </div>
    </div>
  );
}

function CollaborationPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { setCollaborationMode, setViewOnly } = useStore();

  const [roomId, setRoomId] = useState<string | null>(null);

  // 협업 모드 초기 설정
  useEffect(() => {
    setViewOnly(false); // 편집 가능
    setCollaborationMode(true); // 협업 모드 활성화
  }, [setViewOnly, setCollaborationMode]);

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

  return (
    <SimulatorCore
      roomId={roomId}
      showSidebar={true}
      showModeControls={false} // 모드 컨트롤은 숨김 (이미 협업 모드)
      showEditControls={true}
      customHeader={<CollaborationHeader roomId={roomId} />}
      canvasChildren={<CollaborativeCursors />}
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
