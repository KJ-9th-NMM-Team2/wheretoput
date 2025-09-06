import React, { useState } from "react";
import { X } from "lucide-react";

interface EditPopupProps {
  initialTitle: string;
  initialDescription: string;
  initialIsPublic: boolean;
  onSave: (title: string, description: string, isPublic: boolean) => void;
  onDelete: () => void;
  onClose: () => void;
}

// initialTitle - 초기 집 이름 값
// initialDescription - 초기 집 설명 값
// initialIsPublic - 초기 공개 여부 값


// 집 정보 수정 UI
const EditPopup: React.FC<EditPopupProps> = ({
  initialTitle,
  initialDescription,
  initialIsPublic,
  onSave,
  onDelete,
  onClose,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(initialIsPublic);

  const handleSave = () => {
    onSave(title, description, isPublic);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div
        className="bg-white rounded-lg p-6 min-w-80 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">방 정보 수정</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 폼 필드들 */}
        <div className="space-y-4">
          {/* 방 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              방 이름
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              text-gray-500
              "
              placeholder="방 이름을 입력하세요"
            />
          </div>

          {/* 방 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              방 설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-500"
              rows={3}
              placeholder="방에 대한 설명을 입력하세요"
            />
          </div>

          {/* 공개 여부 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label
              htmlFor="isPublic"
              className="ml-2 text-sm font-medium text-gray-700"
            >
              다른 사용자에게 공개
            </label>
          </div>
        </div>

        {/* 버튼들 */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            삭제
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPopup;
