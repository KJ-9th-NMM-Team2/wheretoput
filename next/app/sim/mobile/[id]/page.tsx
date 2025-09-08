"use client";

import React, { useState, useEffect } from "react";
import { SimulatorCore } from "@/components/sim/SimulatorCore";
import { HistoryProvider } from "@/components/sim/history";
import { useStore } from "@/components/sim/useStore.js";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

/**
 * 모바일 시뮬레이터 페이지 (보기 전용)
 */
function SimPageContent({ params }: { params: Promise<{ id: string }> }) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const { setCollaborationMode, setViewOnly, currrentRoomInfo } = useStore();

  // 모바일 전용 초기화 - 보기 모드로 고정
  useEffect(() => {
    setCollaborationMode(false);
    setViewOnly(true); // 보기 전용 모드 활성화
  }, [setCollaborationMode, setViewOnly]);

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
      showSidebar={false}
      showModeControls={false}
      showEditControls={false}
      loadingMessage="방 데이터 로딩 중..."
      loadingIcon="🏠"
      keyboardControlsDisabled={true}
      isMobile={true}
      canvasChildren={
        <OrbitControls
          enableZoom={true}
          enableRotate={true}
          enablePan={true}
          enableDamping={true}
          dampingFactor={0.05} // 더 부드러운 댐핑
          rotateSpeed={0.8} // 회전 속도 증가
          panSpeed={1.0}
          zoomSpeed={0.8} // 줌 속도 증가
          minDistance={1} // 최소 거리 줄임
          maxDistance={50} // 최대 거리 증가
          maxPolarAngle={Math.PI * 0.95} // 바닥 아래로 안 가게
          minPolarAngle={Math.PI * 0.05} // 천장 너무 위로 안 가게
          // 모바일 터치 최적화
          touches={{
            ONE: 0, // 한 손가락으로 회전
            TWO: 2, // 두 손가락으로 확대축소, 이동
          }}
        />
      }
    />
  );
}

export default function SimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <style jsx global>{`
        canvas {
          touch-action: none !important;
        }
      `}</style>
      <HistoryProvider>
        <SimPageContent params={params} />
      </HistoryProvider>
    </>
  );
}
