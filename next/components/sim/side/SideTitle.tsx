"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/components/sim/useStore.js";
import {
  fetchRoomInfo,
  updateRoomInfo,
  deleteRoom,
  type RoomInfo,
} from "@/lib/services/roomService";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ExitConfirmModal from "./ExitConfirmModal";

// React 컴포넌트는 반드시 props 객체 하나만 받아야 하기 때문에 interface로 정의
interface SideTitleProps {
  newRoomInfo: RoomInfo;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  accessType: number; // 1: normal, 2: collaboration
  onEditClick: () => void; // EditPopup 열기 콜백 추가
}


const SideTitle = ({ newRoomInfo, collapsed, setCollapsed, accessType, onEditClick }: SideTitleProps) => {
  // 나가기 확인 모달 상태
  const [showExitModal, setShowExitModal] = useState(false);
  // 현재 방 정보
  const [roomInfo, setRoomInfo] = useState<RoomInfo>(newRoomInfo);
  // 로딩 상태
  const [loading, setLoading] = useState(false);

  // Zustand store에서 현재 방 ID 가져오기
  const {
    currentRoomId,
  } = useStore();

  // 뒤로 가기 버튼
  const router = useRouter();

  // newRoomInfo 변경 시 방 정보 가져오기
  useEffect(() => {
    setRoomInfo(newRoomInfo);
  }, [newRoomInfo])

  // 설정 버튼 클릭 시 부모 컴포넌트의 EditPopup 열기
  const handleSettingsClick = () => {
    onEditClick();
  };

  // 방 나가기 경고창
  const handleOutofRoomClick = () => {
    setShowExitModal(true);
  };
  // // 실제 방 나가기 처리
  const handleConfirmExit = async () => {
    setShowExitModal(false);
    
    // URL에서 from 파라미터 확인하거나 sessionStorage 확인
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from') || "";
    const fromStorage = sessionStorage.getItem('previousPage');

    if (fromParam === 'create' || fromStorage === 'create') {
      router.push('/');
    } else {
      // 협업모드든 일반모드든 홈으로 이동
      router.push('/');
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
            <button
                type="button"
                onClick={handleSettingsClick}
                className="ml-2 px-2 py-1 rounded-md text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors shadow flex items-center cursor-pointer"
              >
              {loading ? "로딩 중..." : roomInfo.title || "어따놀래"}
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`text-gray-500 hover:text-gray-700 transition-all duration-300 cursor-pointer 
            ${
              collapsed ? "" : "ml-auto" // 접혔을 때 안쪽으로
            }`}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>


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
