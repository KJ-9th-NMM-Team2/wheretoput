import React from "react";
import { useStore } from "@/components/sim/useStore.js";

/**
 * 규격 정보 표시/숨김을 토글하는 컨트롤 컴포넌트
 */
export function SpecificationToggle({ className = "" }) {
  const { showSpecifications, setShowSpecifications } = useStore();

  const handleToggle = () => {
    setShowSpecifications(!showSpecifications);
  };

  return (
    <div className={`specification-toggle ${className}`}>
      <button
        onClick={handleToggle}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          showSpecifications
            ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
        title={showSpecifications ? "규격 정보 숨기기" : "규격 정보 표시"}
      >
        <div className="flex items-center space-x-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <span>규격 정보</span>
        </div>
      </button>
      
      {showSpecifications && (
        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <div className="font-medium mb-1">표시 정보:</div>
          <ul className="space-y-1">
            <li>• 벽: 길이, 높이</li>
            <li>• 가구: 크기, 위치 (선택 시)</li>
            <li>• 치수선 (선택된 가구)</li>
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * 간단한 아이콘 버튼 형태의 규격 토글
 */
export function SpecificationToggleIcon({ className = "" }) {
  const { showSpecifications, setShowSpecifications } = useStore();

  const handleToggle = () => {
    setShowSpecifications(!showSpecifications);
  };

  return (
    <button
      onClick={handleToggle}
      className={`specification-toggle-icon p-2 rounded-md transition-all duration-200 ${className} ${
        showSpecifications
          ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
          : "bg-white text-gray-700 shadow-sm hover:bg-gray-50 border border-gray-300"
      }`}
      title={showSpecifications ? "규격 정보 숨기기" : "규격 정보 표시"}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    </button>
  );
}