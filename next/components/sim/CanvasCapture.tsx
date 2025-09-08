import { useThree } from "@react-three/fiber";
import { useEffect, useCallback } from "react";
import { useStore } from "@/components/sim/useStore";
import { postThumbnailImage } from "@/lib/api/thumbnailImage";

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
      // 현재 프레임을 강제 렌더링
      gl.render(scene, camera);

      // 캔버스에서 이미지 데이터 추출
      const dataURL = gl.domElement.toDataURL("image/png", 1.0);

      if (!dataURL || dataURL === "data:,") {
        throw new Error("캡쳐 실패");
      }

      // 파일명에 방 ID와 타임스탬프 포함
      const fileName = `room-${currentRoomId}.png`;

      //console.log(`캔버스 이미지 업로드 중: ${fileName}`);
      const result = await postThumbnailImage(dataURL, fileName, currentRoomId);

      if (result.success) {
        console.log("이미지 업로드 성공✅");
      } else {
        throw new Error(result.error || "업로드 실패");
      }
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

      // 현재 프레임을 강제 렌더링
      gl.render(scene, camera);

      // 캔버스에서 이미지 데이터 추출
      const dataURL = gl.domElement.toDataURL("image/png", 1.0);

      if (!dataURL || dataURL === "data:,") {
        throw new Error("캡쳐 실패");
      }

      // 다운로드 링크 생성 및 클릭
      const link = document.createElement("a");
      link.download = `room-${currentRoomId}-${Date.now()}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

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
