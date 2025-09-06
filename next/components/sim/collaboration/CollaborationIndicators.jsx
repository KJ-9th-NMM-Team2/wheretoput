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
          className="px-2 py-1 text-white text-xs font-medium rounded shadow-lg border border-white/20 whitespace-nowrap"
          style={{
            background: `linear-gradient(135deg, ${userData.color}ee, ${userData.color}cc)`,
            transform: "translateY(-30px)",
            backdropFilter: "blur(4px)",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        >
          {userData.name}
        </div>

        {/* 화살표 */}
        <div
          className="w-0 h-0"
          style={{
            borderLeft: "4px solid transparent",
            borderRight: "4px solid transparent",
            borderTop: `4px solid ${userData.color}ee`,
            transform: "translateY(-26px)",
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))",
          }}
        />
      </div>
    </Html>
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
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            padding: "8px 12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#10b981",
                animation: "pulse 2s infinite",
              }}
            ></div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
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
