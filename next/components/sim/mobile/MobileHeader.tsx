"use client";

import React from "react";

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
  return (
    <div className="bg-white border-b border-gray-200 p-3 absolute top-0 left-0 right-0 z-[100]">
      <div className="flex items-center justify-between">
        <div>
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
