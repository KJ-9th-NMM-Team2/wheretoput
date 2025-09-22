"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';

interface CollaborationEndNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
}

const CollaborationEndNoticeModal: React.FC<CollaborationEndNoticeModalProps> = ({
  isOpen,
  onClose,
  roomId
}) => {
  const router = useRouter();

  const handleConfirm = () => {
    onClose();
    router.replace(roomId ? `/sim/${roomId}` : `/`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleConfirm}
      className="max-w-md"
    >
      <div className="p-6 text-center">
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          협업 종료 알림
        </h3>
        <p className="text-gray-600 mb-6">
          방 소유자가 협업 모드를 종료하여 방에서 나갔습니다.
        </p>
        <button
          onClick={handleConfirm}
          className="w-40 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors tool-btn mx-auto backdrop-blur-sm"
        >
          확인
        </button>
      </div>
    </Modal>
  );
};

export default CollaborationEndNoticeModal;