// 컨텍스트 메뉴 컴포넌트
// 우클릭 시 표시되는 메뉴

import React, { useEffect, useRef, useState } from "react";
import DeleteChatModal from "./DeleteChatModal";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDeleteChat: () => void;
  chatName: string;
}

export default function ContextMenu({
  x,
  y,
  onClose,
  onDeleteChat,
  chatName,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 외부 클릭 시 메뉴 닫기 (모달 열려있을 때는 제외)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // 모달이 열려있으면 click-outside 감지 비활성화
      if (showDeleteModal) {
        return;
      }
      
      // 모달 요소 클릭은 무시
      if (target.closest('[data-modal="delete-chat"]')) {
        return;
      }
      
      if (menuRef.current && !menuRef.current.contains(target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, showDeleteModal]);

  // ESC 키로 메뉴 닫기 (모달 열려있을 때는 제외)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !showDeleteModal) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, showDeleteModal]);

  const handleDeleteClick = () => {
    console.log('🗑️ 컨텍스트 메뉴 - 삭제 버튼 클릭');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    console.log('✅ 모달 - 삭제 확인 버튼 클릭');
    onDeleteChat();
    setShowDeleteModal(false);
    onClose();
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
      <div
        ref={menuRef}
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px]"
        style={{
          left: x,
          top: y,
        }}
      >
        <button
          onClick={handleDeleteClick}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 hover:text-red-700 transition-colors"
        >
          🚪 채팅방 나가기
        </button>
      </div>

      {/* 삭제 확인 모달 */}
      <DeleteChatModal
        isOpen={showDeleteModal}
        chatName={chatName}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}