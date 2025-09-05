// 이미지 모달 컴포넌트
// 채팅방에서 이미지 클릭 시 큰 화면으로 보여주는 모달

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdClose, MdDownload } from "react-icons/md";

interface ImageModalProps {
  isOpen: boolean;
  imageUrl: string;
  s3Key?: string; // S3 키 추가
  onClose: () => void;
}

export default function ImageModal({ isOpen, imageUrl, s3Key, onClose }: ImageModalProps) {
  // 이미지 다운로드 함수
  const handleDownload = async () => {
    try {
      if (!s3Key) {
        console.error('S3 키가 없습니다');
        return;
      }

      // 서버 API를 통해 다운로드
      const response = await fetch(`/api/chat/download-image?s3Key=${encodeURIComponent(s3Key)}`);
      
      if (!response.ok) {
        throw new Error('다운로드 실패');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-image-${Date.now()}.${s3Key.split('.').pop() || 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('이미지 다운로드 실패:', error);
    }
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
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
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm"
          onClick={onClose}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] p-4">
            {/* 상단 버튼들 */}
            <div className="absolute -top-2 -right-2 z-10 flex gap-2">
              {/* 다운로드 버튼 */}
              <button
                onClick={handleDownload}
                className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-all hover:scale-110 cursor-pointer"
                title="이미지 저장"
              >
                <MdDownload size={20} className="text-gray-700" />
              </button>
              
              {/* 닫기 버튼 */}
              <button
                onClick={onClose}
                className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-all hover:scale-110 cursor-pointer"
                title="닫기"
              >
                <MdClose size={20} className="text-gray-700" />
              </button>
            </div>

            {/* 이미지 */}
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={imageUrl}
              alt="확대 이미지"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} // 이미지 클릭 시 모달이 닫히지 않도록
              draggable={false}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}