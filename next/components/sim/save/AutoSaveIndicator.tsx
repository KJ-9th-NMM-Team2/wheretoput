import { useState, useEffect } from "react";
import { useStore } from "../useStore.js";

interface AutoSaveIndicatorProps {
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
}

//  자동저장 상태를 시각적으로 표시
//  저장 중일 때 알림 표시
export default function AutoSaveIndicator({
  position,
}: AutoSaveIndicatorProps) {
  const isSaving = useStore((state) => state.isSaving);
  const lastSavedAt = useStore((state) => state.lastSavedAt);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (isSaving || lastSavedAt) {
      setShowIndicator(true);

      // 5초 후 저장알림 숨김
      if (!isSaving && lastSavedAt) {
        const timer = setTimeout(() => {
          setShowIndicator(false);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [isSaving, lastSavedAt]);

  if (!showIndicator) return null;

  const formatTime = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div
      className={`
        fixed z-50 px-3 py-2 rounded-lg shadow-lg transition-all duration-300 text-white text-xs
        left-1/2 transform -translate-x-1/2 top-20
        ${isSaving ? "bg-blue-500" : "bg-green-500"}
        ${
          showIndicator
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2"
        }
      `}
    >
      <div className="flex items-center gap-2">
        {isSaving ? (
          <>
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
            <span>저장 중...</span>
          </>
        ) : (
          <>
            <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
            <span>자동저장 완료! ({formatTime(lastSavedAt)})</span>
          </>
        )}
      </div>
    </div>
  );
}
