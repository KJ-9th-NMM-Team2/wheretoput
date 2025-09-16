import { useThree } from "@react-three/fiber";
import { useEffect, useCallback } from "react";
import { useStore } from "@/components/sim/useStore";
import { postThumbnailImage } from "@/lib/api/thumbnailImage";

// 캔버스 캡쳐 핵심 로직을 별도 함수로 분리
export const captureCanvas = (gl: any, scene: any, camera: any): string => {
  // 현재 프레임을 강제 렌더링
  gl.render(scene, camera);

  // 캔버스에서 이미지 데이터 추출
  const dataURL = gl.domElement.toDataURL("image/png", 1.0);

  if (!dataURL || dataURL === "data:,") {
    throw new Error("캡쳐 실패");
  }

  return dataURL;
};

// 이미지 다운로드 로직
export const downloadImage = (dataURL: string, filename: string): void => {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 이미지 업로드 로직
export const uploadImage = async (dataURL: string, fileName: string, roomId: string) => {
  const result = await postThumbnailImage(dataURL, fileName, roomId);

  if (result.success) {
    console.log("이미지 업로드 성공✅");
    return { success: true };
  } else {
    throw new Error(result.error || "업로드 실패");
  }
};

export default function CanvasImageLogger() {
  const { gl, scene, camera } = useThree();
  const {
    currentRoomId,
    shouldCapture,
    setShouldCapture,
    shouldCaptureDownload,
    setShouldCaptureDownload,
  } = useStore();

  const captureAndUpload = useCallback(async () => {
    try {
      const dataURL = captureCanvas(gl, scene, camera);
      const fileName = `room-${currentRoomId}-${Date.now()}.png`;
      
      await uploadImage(dataURL, fileName, currentRoomId);
    } catch (error) {
      console.error("❌ Error during canvas capture and upload:", error);
    } finally {
      // 완료 후 상태 리셋 (성공/실패 관계없이)
      setShouldCapture(false);
    }
  }, [gl, scene, camera, currentRoomId, setShouldCapture]);

  const captureAndDownload = useCallback(async () => {
    try {
      console.log("캡쳐 및 다운로드 시작.");

      const dataURL = captureCanvas(gl, scene, camera);
      const filename = `room-${currentRoomId}-${Date.now()}.png`;
      
      downloadImage(dataURL, filename);

      console.log("이미지 다운로드 성공✅");
    } catch (error) {
      console.error("❌ Error during canvas capture and download:", error);
    } finally {
      // 완료 후 상태 리셋 (성공/실패 관계없이)
      setShouldCaptureDownload(false);
    }
  }, [gl, scene, camera, currentRoomId, setShouldCaptureDownload]);

  useEffect(() => {
    if (shouldCapture && currentRoomId) {
      // 2개의 requestAnimationFrame으로 렌더링 완전히 대기
      const handleCapture = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            captureAndUpload();
          });
        });
      };

      // 짧은 지연으로 렌더링 안정화
      const timer = setTimeout(handleCapture, 200);
      return () => clearTimeout(timer);
    }
  }, [shouldCapture, currentRoomId, captureAndUpload]);

  useEffect(() => {
    if (shouldCaptureDownload && currentRoomId) {
      // 2개의 requestAnimationFrame으로 렌더링 완전히 대기
      const handleCaptureDownload = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            captureAndDownload();
          });
        });
      };

      // 짧은 지연으로 렌더링 안정화
      const timer = setTimeout(handleCaptureDownload, 200);
      return () => clearTimeout(timer);
    }
  }, [shouldCaptureDownload, currentRoomId, captureAndDownload]);

  return null;
}
