"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EditPopup from "./EditPopup";
import ExitConfirmModal from "./ExitConfirmModal";
import { useStore } from "@/components/sim/useStore.js";
import {
  fetchRoomInfo,
  updateRoomInfo,
  deleteRoom,
  type RoomInfo,
} from "@/lib/roomService";
import { useRouter } from "next/navigation";
import { saveRoom } from "@/lib/api/saveRoom";
import { useSession } from "next-auth/react";

// React 컴포넌트는 반드시 props 객체 하나만 받아야 하기 때문에 interface로 정의
interface SideTitleProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const SideTitle = ({ collapsed, setCollapsed }: SideTitleProps) => {
  // 팝업창 뜨기 여부
  const [showPopup, setShowPopup] = useState(false);
  // 나가기 확인 모달 상태
  const [showExitModal, setShowExitModal] = useState(false);
  // 현재 방 정보
  const [roomInfo, setRoomInfo] = useState<RoomInfo>({
    title: "",
    description: "",
    is_public: false,
  });
  // 로딩 상태
  const [loading, setLoading] = useState(false);

  // Zustand store에서 현재 방 ID 가져오기
  const {
    saveSimulatorState,
    currentRoomId,
    loadedModels,
    setShouldCapture,
    checkUserRoom, 
  } = useStore();

  // 뒤로 가기 버튼
  const router = useRouter()
  const [saveMessage, setSaveMessage] = useState("");

  const { data: session } = useSession();

  // 컴포넌트 마운트 시 또는 roomId 변경 시 방 정보 가져오기
  useEffect(() => {
    const loadRoomInfo = async () => {
      if (!currentRoomId) return;

      setLoading(true);
      try {
        const info = await fetchRoomInfo(currentRoomId);
        setRoomInfo(info);
      } finally {
        setLoading(false);
      }
    };

    loadRoomInfo();
  }, [currentRoomId]);

  // 설정 버튼 클릭 시 바로 팝업 열기
  const handleSettingsClick = () => {
    setShowPopup(true);
  };

  // 방 정보 저장
  const handleSave = async (
    title: string,
    description: string,
    isPublic: boolean
  ) => {
    const newRoomInfo = { title, description, is_public: isPublic };
    const success = await updateRoomInfo(currentRoomId || "", newRoomInfo);

    if (success) {
      setRoomInfo(newRoomInfo);
    }

    setShowPopup(false);
  };

  // 방 삭제
  const handleDelete = async () => {
    await deleteRoom(currentRoomId || "");
    setShowPopup(false);
  };

  // 방 나가기를 위한 저장 처리
  const handleSaveRoom = async () => {
    await saveRoom({
      currentRoomId,
      setSaveMessage,
      saveSimulatorState,
      setShouldCapture,
      loadedModels,
    });
  };

  // 방 나가기 경고창
  const handleOutofRoomClick = () => {
    setShowExitModal(true);
  };

  // 실제 방 나가기 처리
  const handleConfirmExit = async () => {
    setShowExitModal(false);
    
    const isOwnUserRoom = await checkUserRoom(currentRoomId, session?.user?.id);
    
    // 자신의 방일때는 저장후 나가기
    if (isOwnUserRoom) {
      await handleSaveRoom();
      console.log("방 저장 완료!");
    }
    
    // URL에서 from 파라미터 확인하거나 sessionStorage 확인
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');
    const fromStorage = sessionStorage.getItem('previousPage');
    
    if (fromParam === 'create' || fromStorage === 'create') {
      router.push('/');
    } else {
      router.back();
    }
  };

  return (
    <>
      {/* Logo & Toggle */}
      <div className="flex-shrink-0">
        {" "}
        {/* 크기 고정 */}
        <div className="flex items-center justify-between p-4 ">
          {!collapsed && (
            <span
              className="text-base font-bold truncate max-w-xs"
              title={roomInfo.title}
              style={{ display: "inline-block", verticalAlign: "middle" }}
            >
              {loading ? "로딩 중..." : roomInfo.title || "어따놀래"}
            </span>
          )}
          {!collapsed && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSettingsClick}
                className="ml-2 px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors border border-gray-300 shadow-sm h-8 flex items-center"
              >
                ⚙️
              </button>
              <button
                type="button"
                onClick={handleOutofRoomClick}
                className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors border border-gray-300 shadow-sm h-8 flex items-center"
              >
                나가기
              </button>
            </div>
          )}
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`text-gray-500 hover:text-gray-700 transition-all duration-300 
            ${
              collapsed ? "" : "ml-auto" // 접혔을 때 안쪽으로
            }`}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      {/* 팝업 모달 */}
      {showPopup && (
        <EditPopup
          initialTitle={roomInfo.title}
          initialDescription={roomInfo.description}
          initialIsPublic={roomInfo.is_public}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setShowPopup(false)}
        />
      )}

      {/* 나가기 확인 모달 */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onConfirm={handleConfirmExit}
        onCancel={() => setShowExitModal(false)}
      />
    </>
  );
};

export default SideTitle;
