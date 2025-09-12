import React from "react";

interface EndCollaborationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const EndCollaborationModal: React.FC<EndCollaborationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-40">
      <div
        className="bg-white rounded-lg p-6 min-w-80 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">협업 종료</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 메시지 */}
        <div className="mb-6">
          <p className="text-gray-600">
            협업 모드를 종료하시겠습니까? 현재 상태가 저장되고 모든 사용자가 퇴장됩니다.
          </p>
        </div>

        {/* 버튼들 */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="tool-btn tool-btn-inactive"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="tool-btn tool-btn-active bg-red-500 hover:bg-red-600 text-white"
          >
            협업 종료
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndCollaborationModal;