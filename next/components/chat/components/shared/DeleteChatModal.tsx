// 채팅방 삭제 확인 모달 컴포넌트

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DeleteChatModalProps {
  isOpen: boolean;
  chatName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteChatModal({
  isOpen,
  chatName,
  onConfirm,
  onCancel,
}: DeleteChatModalProps) {
  console.log(' DeleteChatModal 렌더링:', { isOpen, chatName });
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // 모달 열릴 때 스크롤 방지
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
            onClick={onCancel}
          >
            {/* 모달 컨텐츠 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
              data-modal="delete-chat"
            >
              {/* 헤더 */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🚪</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    채팅방 나가기
                  </h3>
                </div>
              </div>

              {/* 메시지 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-900">"{chatName}"</span> 
                  채팅방을 나가시겠습니까?
                </p>
                <div className="mt-3 text-sm text-gray-600">
                  <p>• 대화 내용이 모두 삭제됩니다</p>
                  <p>• 채팅 목록에서 사라집니다</p>
                </div>
              </div>

              {/* 버튼들 */}
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(' 모달 취소 버튼 클릭');
                    onCancel();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors cursor-pointer"
                  type="button"
                >
                  취소
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('🔥 모달 나가기 버튼 클릭');
                    onConfirm();
                  }}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors cursor-pointer"
                  type="button"
                >
                  나가기
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}