"use client";

import React, { useState, useEffect } from "react";
import { ModeControlPanel } from "@/components/sim/collaboration/ModeControlPanel.jsx";
import { SimulatorCore } from "@/components/sim/SimulatorCore";
import { HistoryProvider } from "@/components/sim/history";

/**
 * 일반 시뮬레이터 페이지 (보기/편집 모드)
 */
function SimPageContent({ params }: { params: Promise<{ id: string }> }) {
  const [roomId, setRoomId] = useState<string | null>(null);

  // URL 파라미터에서 room_id 추출
  useEffect(() => {
    const initializeSimulator = async () => {
      try {
        const resolvedParams = await params;
        const currentRoomId = resolvedParams.id;

        console.log(`일반 시뮬레이터 초기화: room_id = ${currentRoomId}`);
        setRoomId(currentRoomId);
      } catch (error) {
        console.error("시뮬레이터 초기화 실패:", error);
      }
    };

    initializeSimulator();
  }, [params]);

  if (!roomId) {
    return <div>Loading...</div>;
  }

  return (
    <SimulatorCore
      roomId={roomId}
      showSidebar={true}
      showModeControls={true}
      showEditControls={true}
      customHeader={<ModeControlPanel roomId={roomId} />}
      loadingMessage="방 데이터 로딩 중..."
      loadingIcon="🏠"
    />
  );
}

export default function SimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <HistoryProvider>
      <SimPageContent params={params} />
    </HistoryProvider>
  );
}
