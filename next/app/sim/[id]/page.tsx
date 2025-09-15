"use client";

import React, { useState, useEffect } from "react";
import { ModeControlPanel } from "@/components/sim/collaboration/ModeControlPanel.jsx";
import { SimulatorCore } from "@/components/sim/SimulatorCore";
import { HistoryProvider } from "@/components/sim/history";
import { useStore } from "@/components/sim/useStore.js";
import { getColab } from "@/lib/api/toggleColab";
import { useRouter } from "next/navigation";

/**
 * 일반 시뮬레이터 페이지 (보기/편집 모드)
 */
function SimPageContent({ params }: { params: Promise<{ id: string }> }) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const { setCollaborationMode, setCurrentRoomId } = useStore();
  const router = useRouter();

  // 일반 시뮬레이터 모드 초기화
  useEffect(() => {
    // 협업 모드를 false로 설정 (일반 편집 모드)
    setCollaborationMode(false);
  }, [setCollaborationMode]);

  // URL 파라미터에서 room_id 추출
  useEffect(() => {
    const initializeSimulator = async () => {
      try {
        const resolvedParams = await params;
        const currentRoomId = resolvedParams.id;

        // /rooms/{id}에서 온 경우 sessionStorage 초기화 (create가 아님을 명시)
        if (document.referrer && document.referrer.includes("/rooms/")) {
          sessionStorage.setItem("previousPage", "rooms");
        }

        setRoomId(currentRoomId);
        setCurrentRoomId(currentRoomId);
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
      loadingIcon=""
      accessType={1}
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
