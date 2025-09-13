import React from "react";
import { useStore } from "@/components/sim/useStore";
import { downloadImage, uploadImage } from "@/components/sim/CanvasCapture";
import { X, Download, Upload } from "lucide-react";
import toast from "react-hot-toast";

export function CaptureModal() {
  const {
    showCaptureModal,
    setShowCaptureModal,
    capturedImageData,
    setCapturedImageData,
    currentRoomId,
    isOwnUserRoom,
  } = useStore();

  const handleClose = () => {
    setShowCaptureModal(false);
    setCapturedImageData(null);
  };

  const handleDownload = () => {
    if (capturedImageData) {
      const filename = `room-${currentRoomId}-${Date.now()}.png`;
      downloadImage(capturedImageData, filename);
      toast.success("이미지 다운로드 완료!");
    }
  };

  const handleUpload = async () => {
    if (capturedImageData && currentRoomId) {
      const uploadPromise = uploadImage(
        capturedImageData,
        `room-${currentRoomId}.png`,
        currentRoomId
      );

      toast.promise(uploadPromise, {
        loading: "썸네일 업로드 중...",
        success: "썸네일 설정 완료!",
        error: "썸네일 설정 실패",
      });

      try {
        await uploadPromise;
      } catch (error) {
        console.error("업로드 실패:", error);
      }
    }
  };

  if (!showCaptureModal || !capturedImageData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto shadow-2xl">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">캡처된 이미지</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* 이미지 프리뷰 */}
        <div className="mb-6">
          <img
            src={capturedImageData}
            alt="캡처된 이미지"
            className="max-w-full h-auto rounded border shadow-md"
            style={{ maxHeight: "60vh" }}
          />
        </div>

        {/* 버튼들 */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium cursor-pointer"
          >
            <Download size={20} />
            다운로드
          </button>

          {/* 썸네일지정은 방 주인만 가능 */}
          {isOwnUserRoom && (
            <button
              onClick={handleUpload}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium cursor-pointer"
            >
              <Upload size={20} />
              썸네일로 지정
            </button>
          )}

          <button
            onClick={handleClose}
            className="flex items-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
