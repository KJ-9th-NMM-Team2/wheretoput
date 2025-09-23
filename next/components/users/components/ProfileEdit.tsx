import React, { useState } from "react";

interface ProfileEditProps {
  currentDisplayName?: string;
  currentName?: string;
  onSave: (displayName: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function ProfileEdit({
  currentDisplayName,
  currentName,
  onSave,
  onClose,
  isLoading = false,
}: ProfileEditProps) {
  const [displayName, setDisplayName] = useState(currentDisplayName || "");

  const handleSave = () => {
    onSave(displayName.trim());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            닉네임 설정
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            다른 사용자에게 표시될 닉네임을 설정하세요.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            닉네임
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={currentName || "닉네임을 입력하세요"}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            maxLength={50}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            비워두면 원래 이름({currentName})이 표시됩니다.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}