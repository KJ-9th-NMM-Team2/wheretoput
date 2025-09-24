import { useEffect, useRef } from "react";
import { useStore } from "../useStore.js";
import toast from "react-hot-toast";

interface AutoSaveIndicatorProps {
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
}

//  자동저장 상태를 Toast로 표시
//  저장 중일 때와 완료 시 Toast 알림 표시
export default function AutoSaveIndicator({
  position,
}: AutoSaveIndicatorProps) {
  const isSaving = useStore((state) => state.isSaving);
  const lastSavedAt = useStore((state) => state.lastSavedAt);
  const toastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isSaving) {
      // 저장 시작할 때
      const toastId = toast.loading("저장 중...", {
        position: "top-center",
        style: {
          marginTop: "80px", // ModeControlPanel 아래로 위치 조정


        },
      });
      toastIdRef.current = toastId;
    } else if (lastSavedAt && toastIdRef.current) {
      // 저장 완료될 때
      toast.success("자동저장 완료!", {
        id: toastIdRef.current, // 같은 토스트를 업데이트
        duration: 1500,
        style: {
          marginTop: "80px", // ModeControlPanel 아래로 위치 조정


        },
      });
      toastIdRef.current = null;
    }
  }, [isSaving, lastSavedAt]);

  return null; // Toast가 모든 UI를 처리하므로 별도 렌더링 불필요
}
