import React from "react";
import { useStore } from "@/components/sim/useStore";
import { TbScreenshot } from "react-icons/tb";

// 시뮬레이터 - 화면 캡쳐 컴포넌트

export function CaptureControlPanel({ isPopup = false }) {
  const { setShouldCaptureModal } = useStore();

  const handleCapture = () => {
    // Canvas 내부의 CaptureHandler에서 캡처를 실행하도록 트리거
    setShouldCaptureModal(true);
  };

  return (
    <div
      className={`
      bg-black bg-opacity-70 p-4 rounded text-white text-sm w-[250px] max-h-96 overflow-y-auto
      ${
        isPopup
          ? "static"
          : "absolute top-1/2 -translate-y-1/2 left-2.5 z-[100]"
      }
    `}
    >
      <h3 style={{ margin: "0 0 10px 0", fontSize: "20px" }}>
        <span> Screen Capture </span>
      </h3>

      <div className="cursor-default">
        <CaptureButton Click={handleCapture} />
      </div>
    </div>
  );
}

function CaptureButton({ Click }) {
  return (
    <button
      onClick={Click}
      className="w-full px-4 py-2.5 bg-blue-500 hover:bg-green-600 text-white border-none rounded text-md cursor-pointer transition-colors duration-200
      tool-btn tool-btn-green-active"
    >
      Capture
    </button>
  );
}
