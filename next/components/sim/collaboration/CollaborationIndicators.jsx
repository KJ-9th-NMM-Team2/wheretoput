import React from "react";
import { useStore } from "@/components/sim/useStore.js";
import { Html } from "@react-three/drei";

// CSS 애니메이션 스타일 추가
if (
  typeof window !== "undefined" &&
  !document.querySelector("#collaboration-styles")
) {
  const style = document.createElement("style");
  style.id = "collaboration-styles";
  style.textContent = `
    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.1); }
      100% { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

/**
 * 협업 모드에서 다른 사용자들의 상태를 시각적으로 표시하는 컴포넌트들
 *
 * 포함 기능:
 * - 사용자별 커서 표시
 * - 선택된 모델 하이라이트 (다른 사용자가 선택한 모델)
 * - 연결된 사용자 목록 표시
 */

// 모델 위에 표시되는 사용자 이름 말풍선
export function ModelTooltip({ modelId, position, boundingBox }) {
  const { connectedUsers, loadedModels } = useStore();

  // 이 모델에 말풍선을 표시할 사용자 찾기
  const tooltipUser = Array.from(connectedUsers.entries()).find(
    ([userId, userData]) =>
      userData.showTooltip && userData.tooltipModelId === modelId
  );

  if (!tooltipUser) return null;

  const [userId, userData] = tooltipUser;

  // boundingBox만으로 위치 계산 (position 무시)
  const tooltipPosition = boundingBox
    ? [
        (boundingBox.max.x + boundingBox.min.x) / 2, // 중앙 X
        boundingBox.max.y, // 최상단 Y
        (boundingBox.max.z + boundingBox.min.z) / 2, // 중앙 Z
      ]
    : [position[0], position[1] + 1, position[2]]; // fallback

  return (
    <Html
      position={tooltipPosition}
      center
      distanceFactor={8}
      zIndexRange={[100, 0]}
      style={{
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* 말풍선 */}
        <div
          className="text-white font-semibold border border-white/50 whitespace-nowrap no-select"
          style={{
            background: `linear-gradient(135deg, ${userData.color}dd, ${userData.color}99)`,
            transform: "translateY(-3rem)",
            backdropFilter: "blur(0.25rem)",
            borderRadius: "0.5rem",
            fontSize: "1.8rem",
            padding: "0.5rem 0.5rem",
            boxShadow: `0 0.25rem 0.75rem rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.3)`,
          }}
        >
          {userData.name}
        </div>

        {/* 화살표 */}
        <div
          className="w-0 h-0"
          style={{
            borderLeft: "1rem solid transparent",
            borderRight: "1rem solid transparent",
            borderTop: `1rem solid ${userData.color}dd`,
            transform: "translateY(-2.25rem)",
            filter: "drop-shadow(0 0.125rem 0.25rem rgba(0,0,0,0.2))",
          }}
        />
      </div>
    </Html>
  );
}

// 협업 종료 버튼 컴포넌트 (방 소유자에게만 표시)
export function CollaborationEndButton({ onEndCollaboration }) {
  return (
    <div className="fixed top-16 right-4 z-50">
      <button
        onClick={onEndCollaboration}
        className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-lg font-medium hover:from-red-600 hover:to-red-700 hover:scale-105 transition-all shadow-lg"
        title="협업 모드를 종료하고 개인 편집 모드로 돌아갑니다"
      >
        협업 종료
      </button>
    </div>
  );
}

// 연결된 사용자 목록을 UI 상단에 표시
export function ConnectedUsersList() {
  const { connectedUsers, collaborationMode, isConnected } = useStore();

  if (!collaborationMode) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        textAlign: "center",
      }}
    >
      {/* 연결된 사용자 목록 */}
      {connectedUsers.size > 0 ? (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/20">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-gray-700">
              협업 중 • {connectedUsers.size}명
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
            }}
          >
            {Array.from(connectedUsers.entries()).map(([userId, userData]) => (
              <div
                key={userId}
                style={{
                  background: `linear-gradient(135deg, ${userData.color}, ${userData.color}dd)`,
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "16px",
                  fontSize: "11px",
                  fontWeight: "500",
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
              >
                {userData.name}
              </div>
            ))}
          </div>
        </div>
      ) : isConnected ? (
        <div
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(8px)",
            borderRadius: "10px",
            padding: "6px 10px",
            fontSize: "11px",
            color: "#6b7280",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#f59e0b",
            }}
          ></div>
          혼자 편집 중
        </div>
      ) : (
        <div
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(8px)",
            borderRadius: "10px",
            padding: "6px 10px",
            fontSize: "11px",
            color: "#ef4444",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#ef4444",
            }}
          ></div>
          연결 끊김
        </div>
      )}
    </div>
  );
}

// 협업 모드 활성화시 표시되는 안내 메시지
