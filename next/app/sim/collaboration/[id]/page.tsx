"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/components/sim/useStore.js";
import { SimulatorCore } from "@/components/sim/SimulatorCore";
import {
  ConnectedUsersList,
  CollaborationEndButton,
} from "@/components/sim/collaboration/CollaborationIndicators.jsx";
import { useCollaboration } from "@/components/sim/collaboration/useCollaboration.js";
import { HistoryProvider } from "@/components/sim/history";
import { connectSocket, getSocket } from "@/lib/client/socket";
import { useSession } from "next-auth/react";
import { getColab, toggleColab } from "@/lib/api/toggleColab";
import { useRouter } from "next/navigation";
import GameStyleChatPopup from "@/components/chat/components/GameStyleChatPopup";
import CollaborationChatRoomSelector from "@/components/chat/components/CollaborationChatRoomSelector";
import { useChatConnection } from "@/components/chat/hooks/useChatConnection";
import { useChatMessages } from "@/components/chat/hooks/useChatMessages";
import { useChatRooms } from "@/components/chat/hooks/useChatRooms";
import { formatRelativeTime } from "@/components/chat/utils/chat-utils";

// 가독성 있는 색상 생성 함수
function generateReadableColor() {
  const colors = [
    "#3B82F6", // blue
    "#EF4444", // red
    "#10B981", // green
    "#F59E0B", // yellow
    "#8B5CF6", // violet
    "#EC4899", // pink
    "#06B6D4", // cyan
    "#84CC16", // lime
    "#F97316", // orange
    "#6366F1", // indigo
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function CollaborationPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const {
    setCollaborationMode,
    setViewOnly,
    setCurrentUser,
    checkUserRoom,
    saveSimulatorState,
  } = useStore();

  const [roomId, setRoomId] = useState<string | null>(null);
  const [isAccessChecking, setIsAccessChecking] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  // 채팅 관련 상태와 훅
  const [isChatFocused, setIsChatFocused] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  
  const { token } = useChatConnection(true); // 항상 연결
  
  const {
    selectedMessages,
    text,
    setText,
    onSendMessage,
    onEditorKeyDown
  } = useChatMessages(
    true, // 항상 활성화
    selectedChatId, // 선택된 채팅방 ID
    token,
    session?.user?.id || null,
    () => {} // updateChatRoom은 빈 함수로
  );

  // 협업 모드 초기 설정
  useEffect(() => {
    setViewOnly(false); // 편집 가능
    setCollaborationMode(true); // 협업 모드 활성화

    // 현재 사용자 정보 설정 (임시로 랜덤 ID 생성)
    setCurrentUser({
      id: session?.user.id || `user_${Math.floor(Math.random() * 10000)}`,
      name: session?.user.name || `Guest_${Math.floor(Math.random() * 1000)}`,
      color: generateReadableColor(),
    });
  }, [setViewOnly, setCollaborationMode, setCurrentUser]);

  // 협업 훅 활성화
  const collaboration = useCollaboration(roomId);

  // 협업 모드 접근 권한 체크
  useEffect(() => {
    const checkCollaborationAccess = async () => {
      try {
        const resolvedParams = await params;
        const currentRoomId = resolvedParams.id;

        // 1. 방 소유자인지 확인
        let ownerStatus = false;
        if (!session?.user.id) {
          ownerStatus = false;
        } else {
          ownerStatus = await checkUserRoom(currentRoomId, session.user.id);
        }

        setIsOwner(ownerStatus); // 소유자 상태 저장

        if (ownerStatus) {
          // 방 소유자인 경우: 협업 모드 상태 확인 후 자동으로 켜기
          const collabResult = await getColab(currentRoomId);

          if (collabResult.success) {
            if (!collabResult.data.collab_on) {
              // 협업 모드가 꺼져있으면 켜기
              const toggleResult = await toggleColab(currentRoomId, true);
              if (toggleResult.success) {
                console.log(
                  "방 주인이므로 협업 모드를 자동으로 활성화했습니다"
                );
              } else {
                console.error("협업 모드 활성화 실패:", toggleResult.error);
              }
            }
            setRoomId(currentRoomId);
            setIsAccessChecking(false);
          } else {
            console.error("협업 상태 확인 실패:", collabResult.error);
            setAccessDenied(true);
            setIsAccessChecking(false);
          }
        } else {
          // 일반 사용자인 경우: 협업 모드가 켜져있는지 확인
          const collabResult = await getColab(currentRoomId);

          if (collabResult.success && collabResult.data.collab_on) {
            // 협업 모드가 켜져있으면 접근 허용
            setRoomId(currentRoomId);
            setIsAccessChecking(false);
          } else {
            // 협업 모드가 꺼져있거나 오류 시 접근 거부
            console.log("협업 모드가 비활성화되어 있습니다");
            console.log("setAccessDenied(true) 호출");
            setAccessDenied(true);
            setIsAccessChecking(false);
            console.log("상태 업데이트 완료");
          }
        }
      } catch (error) {
        console.error("협업 모드 접근 권한 체크 실패:", error);
        setAccessDenied(true);
        setIsAccessChecking(false);
      }
    };

    if (session !== undefined) {
      checkCollaborationAccess();
    }
  }, [params, session, checkUserRoom]);

  // 접근 거부 (우선순위 높게)
  if (accessDenied) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-5">
        <div className="text-2xl font-bold">
          🚫 협업 모드에 접근할 수 없습니다
        </div>
        <div className="text-base text-gray-600">
          방 소유자가 협업 모드를 활성화해야 접근할 수 있습니다
        </div>
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 bg-blue-500 text-white border-none rounded-md cursor-pointer hover:bg-blue-600 transition-colors"
        >
          이전 페이지로 돌아가기
        </button>
      </div>
    );
  }

  // 통합된 로딩 및 상태 관리
  if (isAccessChecking || !roomId) {
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        🤝 협업 모드 시뮬레이터 로딩 중...
      </div>
    );
  }

  // 협업 종료 핸들러
  const handleEndCollaboration = async () => {
    if (!roomId) return;

    if (
      confirm(
        "협업 모드를 종료하시겠습니까? 현재 상태가 저장되고 모든 사용자가 퇴장됩니다."
      )
    ) {
      try {
        const result = await toggleColab(roomId, false);
        if (result.success) {
          collaboration.broadcastCollaborationEnd();
          await saveSimulatorState(); // 종료 전 DB에 저장

          router.push(`/sim/${roomId}`);
        } else {
          console.error("협업 모드 종료 실패:", result.error);
          alert("협업 모드 종료에 실패했습니다");
        }
      } catch (error) {
        console.error("협업 종료 중 오류:", error);
        alert("협업 모드 종료 중 오류가 발생했습니다");
      }
    }
  };

  return (
    <>
      <SimulatorCore
        roomId={roomId}
        showSidebar={true}
        showModeControls={false} // 모드 컨트롤은 숨김 (이미 협업 모드)
        showEditControls={true}
        keyboardControlsDisabled={isChatFocused} // 채팅 입력 중일 때 키보드 컨트롤 비활성화
        additionalUI={
          <>
            <ConnectedUsersList />
            {/* 방 소유자에게만 협업 종료 버튼 표시 */}
            {isOwner && (
              <CollaborationEndButton
                onEndCollaboration={handleEndCollaboration}
              />
            )}
            {/* 채팅방 선택 버튼 - 로그인한 사용자에게만 표시 */}
            {session?.user?.id && (
              <CollaborationChatRoomSelector
                selectedChatId={selectedChatId}
                onChatSelect={setSelectedChatId}
                currentUserId={session.user.id}
              />
            )}
          </>
        }
        loadingMessage="협업 모드 로딩 중..."
        loadingIcon="🤝"
      />
      
      {/* 게임 스타일 채팅 UI - 로그인한 사용자가 채팅방을 선택한 경우에만 표시 */}
      {session?.user?.id && selectedChatId && (
        <GameStyleChatPopup
          isVisible={true}
          messages={selectedMessages}
          text={text}
          setText={setText}
          onSendMessage={(content) => selectedChatId && onSendMessage(selectedChatId, content)}
          onChatFocus={setIsChatFocused}
          currentUserId={session.user.id}
        />
      )}
    </>
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
