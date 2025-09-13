import { useEffect, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import { useStore } from "@/components/sim/useStore";
import { captureCanvas } from "@/components/sim/CanvasCapture";

export function CaptureHandler() {
  const { gl, scene, camera } = useThree();
  const {
    shouldCaptureModal,
    setShouldCaptureModal,
    setShowCaptureModal,
    setCapturedImageData,
  } = useStore();

  const handleCapture = useCallback(async () => {
    try {
      // 캔버스 캡처
      const dataURL = captureCanvas(gl, scene, camera);
      
      // 캡처된 이미지를 store에 저장
      setCapturedImageData(dataURL);
      
      // 모달 표시
      setShowCaptureModal(true);
    } catch (error) {
      console.error("캡처 실패:", error);
    } finally {
      // 트리거 상태 리셋
      setShouldCaptureModal(false);
    }
  }, [gl, scene, camera, setCapturedImageData, setShowCaptureModal, setShouldCaptureModal]);

  useEffect(() => {
    if (shouldCaptureModal) {
      // 렌더링 완료 후 캡처 실행
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            handleCapture();
          });
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [shouldCaptureModal, handleCapture]);

  return null;
}