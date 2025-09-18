"use client";

import React, { useState, useEffect } from "react";
import { ModeControlPanel } from "@/components/sim/collaboration/ModeControlPanel.jsx";
import { SimulatorCore } from "@/components/sim/SimulatorCore";
import { HistoryProvider } from "@/components/sim/history";
import { useStore } from "@/components/sim/useStore.js";
import { getColab } from "@/lib/api/toggleColab";
import { useRouter } from "next/navigation";
import MobileBlockModal from "@/components/ui/MobileBlockModal";

/**
 * 일반 시뮬레이터 페이지 (보기/편집 모드)
 */
function SimPageContent({ params }: { params: Promise<{ id: string }> }) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { setCollaborationMode, setCurrentRoomId } = useStore();
  const router = useRouter();

  // 모바일 감지 (처음 진입 시에만)
  useEffect(() => {
    setIsMobile(window.innerWidth < 640); // sm 브레이크포인트
  }, []);

  // 일반 시뮬레이터 모드 초기화
  useEffect(() => {
    // 협업 모드를 false로 설정 (일반 편집 모드)
    setCollaborationMode(false);
  }, [setCollaborationMode]);

  // URL 파라미터에서 room_id 추출 및 모바일 리다이렉트 처리
  useEffect(() => {
    const initializeSimulator = async () => {
      try {
        const resolvedParams = await params;
        const currentRoomId = resolvedParams.id;

        // 모바일 환경에서는 리다이렉트하지 않고 팝업 표시

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
  }, [params, isMobile, router]);

  if (!roomId) {
    return <div>Loading...</div>;
  }

  if (isMobile) {
    return (
      <MobileBlockModal
        title="PC에서만 지원됩니다"
        description="시뮬레이터 모드는 더 나은 편집 환경을 위해 PC(데스크탑/노트북)에서만 이용 가능합니다."
        showMobileButton={true}
        mobileButtonText="모바일 버전으로 보기"
        onMobileButtonClick={() => router.push(`/sim/mobile/${roomId}`)}
        onBackButtonClick={() => router.back()}
      />
    );
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
