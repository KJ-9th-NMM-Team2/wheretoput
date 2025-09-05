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

// 다른 사용자의 커서를 3D 공간에 표시
export function CollaborativeCursors() {
  const { connectedUsers } = useStore();

  return (
    <>
      {Array.from(connectedUsers.entries()).map(([userId, userData]) => {
        if (!userData.cursor) return null;

        return (
          <group key={`cursor-${userId}`} position={userData.cursor}>
            {/* 3D 커서 포인터 */}
            <mesh>
              <coneGeometry args={[0.1, 0.3, 8]} />
              <meshBasicMaterial color={userData.color} />
            </mesh>

            {/* 사용자 이름 라벨 */}
            <Html
              position={[0, 0.5, 0]}
              style={{
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              <div
                style={{
                  background: userData.color,
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  transform: "translate(-50%, -100%)",
                }}
              >
                {userData.name}
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}

// 다른 사용자가 선택한 모델 주변에 표시되는 하이라이트
export function CollaborativeSelectionHighlight({ modelId, position }) {
  const { connectedUsers } = useStore();

  // 이 모델을 선택한 사용자 찾기
  const selectingUser = Array.from(connectedUsers.entries()).find(
    ([userId, userData]) => userData.selectedModel === modelId
  );

  if (!selectingUser) return null;

  const [userId, userData] = selectingUser;

  return (
    <group position={position}>
      {/* 선택 링 애니메이션 */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1, 1.2, 32]} />
        <meshBasicMaterial color={userData.color} transparent opacity={0.6} />
      </mesh>

      {/* 선택한 사용자 표시 */}
      <Html
        position={[0, 2, 0]}
        style={{
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          style={{
            background: userData.color,
            color: "white",
            padding: "3px 6px",
            borderRadius: "3px",
            fontSize: "11px",
            fontWeight: "bold",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            transform: "translate(-50%, 0)",
            opacity: 0.9,
          }}
        >
          {userData.name}이 선택함
        </div>
      </Html>
    </group>
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
