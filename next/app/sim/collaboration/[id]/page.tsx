"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import MobileBlockModal from "@/components/ui/MobileBlockModal";
import CollaborationChatRoomSelector from "@/components/chat/components/CollaborationChatRoomSelector";
import { useChatConnection } from "@/components/chat/hooks/useChatConnection";
import { useChatMessages } from "@/components/chat/hooks/useChatMessages";
import { useChatRooms } from "@/components/chat/hooks/useChatRooms";
import { formatRelativeTime } from "@/components/chat/utils/chat-utils";
import EndCollaborationModal from "@/components/sim/collaboration/EndCollaborationModal";
import CollaborationEndNoticeModal from "@/components/sim/collaboration/CollaborationEndNoticeModal";
import { api } from "@/lib/client/api";
import {
  checkCollaborationAccess,
  setupChatRoom,
} from "@/components/sim/collaboration/utils/collaborationUtils";


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
    saveSimulatorState,
    currentRoomInfo,
  } = useStore();

  const checkUserRoomFn = useStore((state) => state.checkUserRoom);

  const checkUserRoom = useCallback(
    (roomId: string, userId: string) => {
      return checkUserRoomFn(roomId, userId);
    },
    [checkUserRoomFn]
  );

  const [roomId, setRoomId] = useState<string | null>(null);
  const [isAccessChecking, setIsAccessChecking] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  // 채팅 관련 상태와 훅
  const [isChatFocused, setIsChatFocused] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Sidebar collapsed 상태
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // 협업 종료 모달 상태
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);

  const { token } = useChatConnection(!!selectedChatId); // 채팅방 선택 시에만 연결

  // 채팅방 업데이트 콜백을 useCallback으로 메모이제이션
  const handleChatRoomUpdate = useCallback(() => {
    // 협업 모드에서는 채팅방 목록을 관리하지 않으므로 빈 함수
  }, []);

  const { selectedMessages, text, setText, onSendMessage, onEditorKeyDown } =
    useChatMessages(
      !!selectedChatId, // 채팅방 선택 시에만 활성화
      selectedChatId, // 선택된 채팅방 ID
      token,
      session?.user?.id || null,
      handleChatRoomUpdate
    );

  // 모바일 감지 (처음 진입 시에만)
  useEffect(() => {
    setIsMobile(window.innerWidth < 640); // sm 브레이크포인트
  }, []);

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

  // 1단계: 협업 모드 접근 권한 체크 (채팅방 처리 제외)
  useEffect(() => {
    const handleCollaborationAccess = async () => {
      try {
        const resolvedParams = await params;
        const currentRoomId = resolvedParams.id;

        // 모바일 환경에서는 팝업 표시를 위해 체크만 하고 넘어감
        // if (isMobile) {
        //   router.push('/');
        //   return;
        // }

        // 방 소유자인지 확인
        let ownerStatus = false;
        if (session?.user.id) {
          ownerStatus = await checkUserRoom(currentRoomId, session.user.id);
        }

        setIsOwner(ownerStatus);

        // 협업 접근 권한만 체크 (채팅방 처리는 나중에)

        const result = await checkCollaborationAccess({
          currentRoomId,
          isOwner: ownerStatus,
        });

        if (result.success) {
          setRoomId(result.roomId!); // roomId 설정하여 소켓 연결 시작
        } else {
          setAccessDenied(true);
          setIsAccessChecking(false);
        }
      } catch (error) {
        setAccessDenied(true);
        setIsAccessChecking(false);
      }
    };

    if (session !== undefined) {
      handleCollaborationAccess();
    }
  }, [params, session, checkUserRoom]);

  // 2단계: 협업 소켓 연결 (roomId 설정 후)
  const { showCollaborationEndNotice, setShowCollaborationEndNotice, ...collaboration } = useCollaboration(roomId);

  // 3단계: 소켓 연결 완료 후 채팅방 설정
  useEffect(() => {
    const handleChatRoomSetup = async () => {
      if (!roomId || !collaboration?.isConnected || !isAccessChecking) return;

      try {
        const chatResult = await setupChatRoom({
          currentRoomId: roomId,
          isOwner,
          userId: session?.user?.id,
          currentRoomInfo,
        });

        if (chatResult.success) {
          if (chatResult.selectedChatId) {
            setSelectedChatId(chatResult.selectedChatId);
          }
          setIsAccessChecking(false); // 모든 설정 완료
        } else {
          console.error("채팅방 설정 실패:", chatResult.error);
          setIsAccessChecking(false); // 채팅방 실패해도 협업은 진행
        }
      } catch (error) {
        console.error("채팅방 설정 중 오류:", error);
        setIsAccessChecking(false);
      }
    };

    handleChatRoomSetup();
  }, [
    roomId,
    collaboration?.isConnected,
    isOwner,
    session?.user?.id,
    currentRoomInfo,
    isAccessChecking,
  ]);

  // 모바일 접근 제한 (우선순위 높게)
  if (isMobile) {
    return (
      <MobileBlockModal
        title="PC에서만 지원됩니다"
        description="협업 모드는 더 나은 편집 환경을 위해 PC(데스크탑/노트북)에서만 이용 가능합니다."
        showMobileButton={false}
        onBackButtonClick={() => router.back()}
      />
    );
  }

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
    setIsEndModalOpen(false);
  };

  return (
    <>
      <SimulatorCore
        roomId={roomId}
        accessType={2}
        showSidebar={true}
        showModeControls={false} // 모드 컨트롤은 숨김 (이미 협업 모드)
        showEditControls={true}
        keyboardControlsDisabled={isChatFocused} // 채팅 입력 중일 때 키보드 컨트롤 비활성화
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        additionalUI={
          <>
            <ConnectedUsersList />
            {/* 방 소유자에게만 협업 종료 버튼 표시 */}
            {isOwner && (
              <CollaborationEndButton
                onEndCollaboration={() => setIsEndModalOpen(true)}
              />
            )}
            {/* 채팅방 선택 버튼 - 로그인한 사용자에게만 표시 */}
            {session?.user?.id && (
              <CollaborationChatRoomSelector
                selectedChatId={selectedChatId}
                onChatSelect={setSelectedChatId}
                currentUserId={session.user.id}
                sidebarCollapsed={sidebarCollapsed}
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
          onSendMessage={(content) =>
            selectedChatId && onSendMessage(selectedChatId, content)
          }
          onChatFocus={setIsChatFocused}
          currentUserId={session.user.id}
          sidebarCollapsed={sidebarCollapsed}
        />
      )}

      {/* 협업 종료 확인 모달 */}
      <EndCollaborationModal
        isOpen={isEndModalOpen}
        onConfirm={handleEndCollaboration}
        onCancel={() => setIsEndModalOpen(false)}
      />

      {/* 협업 종료 알림 모달 */}
      <CollaborationEndNoticeModal
        isOpen={showCollaborationEndNotice}
        onClose={() => setShowCollaborationEndNotice(false)}
        roomId={roomId}
      />
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