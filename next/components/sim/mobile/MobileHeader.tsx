"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface MobileHeaderProps {
  roomInfo?: {
    title?: string;
    user?: {
      name?: string;
    };
  };
  controlsRef: React.RefObject<any>;
}

export function MobileHeader({ roomInfo, controlsRef }: MobileHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="bg-white border-b border-gray-200 p-3 absolute top-0 left-0 right-0 z-[100]">
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1 ml-3">
          <h3 className="font-semibold text-gray-900 text-sm">
            {roomInfo?.title || "방 제목"}
          </h3>
          <div className="text-gray-600 text-xs">
            한 손가락: 회전 | 두 손가락: 확대/축소
          </div>
        </div>
      </div>
    </div>
  );
}
