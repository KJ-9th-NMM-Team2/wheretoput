import React, { useState } from "react";

// [09.09] 접을 수 있는 사이드바 컴포넌트
export function CollapsibleSidebar({
  children,
  title,
  onClose,
  defaultCollapsed = false,
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // 현재 접혀진 상태일때 "<" 펼치기 버튼 표시
  if (isCollapsed) {
    return (
      <div className="fixed top-1/2 right-4 -translate-y-1/2 z-[200] ">
        <button
          onClick={toggleCollapse}
          className="bg-white text-black border border-gray-200 shadow-2xl rounded-xl p-3 hover:bg-gray-50 transition-colors cursor-pointer"
          title="가구 편집 패널 펼치기"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>
    );
  }

  // 사이드바 펼친 상태일때
  return (
    <div className="fixed top-1/2 right-4 -translate-y-1/2 z-[200] flex items-center gap-2">
      {/* 접기 버튼 */}
      <button
        onClick={toggleCollapse}
        className="bg-white text-black border border-gray-200 shadow-2xl rounded-xl p-2 hover:bg-gray-50 transition-colors cursor-pointer"
        title="패널 접기"
      >
        <svg
          className="w-4 h-4 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* 사이드바 */}
      <div className="w-80 max-h-[80vh] select-none">
        <div className="bg-white text-black flex flex-col border border-gray-200 shadow-2xl rounded-xl overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
            <span className="text-base font-bold ">{title}</span>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors text-lg cursor-pointer"
              title="닫기"
            >
              ×
            </button>
          </div>

          {/* 스크롤 가능한 콘텐츠 영역 */}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
