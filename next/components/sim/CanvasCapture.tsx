import { useThree } from "@react-three/fiber";
import { useEffect, useCallback } from "react";
import { useStore } from "@/components/sim/useStore";
import { postThumbnailImage } from "@/lib/api/thumbnailImage";

export default function CanvasImageLogger() {
  const { gl, scene, camera } = useThree();
  const { currentRoomId, shouldCapture, setShouldCapture } = useStore();

  const captureAndUpload = useCallback(async () => {
    try {
      console.log("🎯 Starting canvas capture...");

      // 현재 프레임을 강제 렌더링
      gl.render(scene, camera);

      // 캔버스에서 이미지 데이터 추출
      const dataURL = gl.domElement.toDataURL("image/png", 1.0);

      if (!dataURL || dataURL === "data:,") {
        throw new Error("Failed to capture canvas data");
      }

      // 파일명에 방 ID와 타임스탬프 포함
      const fileName = `room-${currentRoomId}.png`;

      console.log(`📸 Uploading canvas image: ${fileName}`);
      const result = await postThumbnailImage(dataURL, fileName, currentRoomId);

      if (result.success) {
        console.log("✅ Canvas image uploaded successfully");
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("❌ Error during canvas capture and upload:", error);
    } finally {
      // 완료 후 상태 리셋 (성공/실패 관계없이)
      setShouldCapture(false);
    }
  }, [gl, scene, camera, currentRoomId, setShouldCapture]);

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

  return null;
}
