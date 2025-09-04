"use client";

import React, { useState } from "react";
import { useStore } from "@/components/sim/useStore.js";
import { useSession } from "next-auth/react";

// 모드 버튼 컴포넌트
function ModeButton({ isActive, onClick, label, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: isActive
          ? `${color}20` // 20% opacity
          : "transparent",
        border: `1px solid ${isActive ? color : "transparent"}`,
        color: isActive ? color : "#9CA3AF",
        padding: "8px 12px",
        borderRadius: "4px",
        fontSize: "14px",
        fontWeight: isActive ? "600" : "400",
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        minWidth: "60px",
        justifyContent: "center",
      }}
    >
      <span>{label}</span>
    </button>
  );
}

/**
 * 시뮬레이터의 모드 제어 패널
 *
 * 3가지 모드:
 * - 보기: 읽기 전용 모드
 * - 편집: 혼자 편집 모드
 * - 협업: 실시간 공동 편집 모드
 */
export function ModeControlPanel({ roomId }) {
  const {
    viewOnly,
    setViewOnly,
    collaborationMode,
    setCollaborationMode,
    currentUser,
    setCurrentUser,
  } = useStore();
  const { data: session } = useSession();

  // 현재 모드 결정
  const getCurrentMode = () => {
    if (viewOnly) return "view";
    if (collaborationMode) return "collaboration";
    return "edit";
  };

  // 모드 변경 핸들러
  const handleModeChange = (newMode) => {
    switch (newMode) {
      case "view":
        setViewOnly(true);
        setCollaborationMode(false);
        break;
      case "edit":
        setViewOnly(false);
        setCollaborationMode(false);
        break;
    }
  };

  return (
    <>
      {/* 메인 모드 컨트롤 패널 */}
      <div
        style={{
          position: "fixed",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.8)",
          padding: "8px",
          borderRadius: "8px",
          zIndex: 100,
          color: "white",
          fontSize: "13px",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "6px",
            padding: "4px",
          }}
        >
          {/* 보기 모드 버튼 */}
          <ModeButton
            isActive={getCurrentMode() === "view"}
            onClick={() => handleModeChange("view")}
            label="보기"
            color="#22C55E"
          />

          {/* 편집 모드 버튼 */}
          <ModeButton
            isActive={getCurrentMode() === "edit"}
            onClick={() => handleModeChange("edit")}
            label="편집"
            color="#3B82F6"
          />
        </div>
      </div>
    </>
  );
}
