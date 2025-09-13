import React, { useState } from "react";
import { ControlPanel } from "@/components/sim/mainsim/ControlPanel";
import { LightControlPanel } from "@/components/sim/mainsim/LightControlPanel";
import { CameraControlPanel } from "@/components/sim/mainsim/CameraControlPanel";
import { ColorControlPanel } from "@/components/sim/mainsim/ColorControlPanel";
import { CaptureControlPanel } from "@/components/sim/mainsim/CaptureControlPanel";
import { HelpPopup } from "@/components/sim/mainsim/HelpPopup";
import { useStore } from "@/components/sim/useStore.js";

// react-icons 추가 부분
import { FaCameraRetro, FaPalette, FaShareAlt } from "react-icons/fa";
import { MdSunny, MdHelp } from "react-icons/md";
import { TbScreenshot } from "react-icons/tb";
// =====================================

export function ControlIcons({ controlsRef }) {
  const [showControlPopup, setShowControlPopup] = useState(false);
  const [showLightPopup, setShowLightPopup] = useState(false);
  const [showCameraPopup, setShowCameraPopup] = useState(false);
  const [showColorPopup, setShowColorPopup] = useState(false);
  const [showCapturePopup, setShowCapturePopup] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [showHelpPopup, setShowHelpPopup] = useState(false);

  // 공유 링크 (사용자가 설정)
  const { currentRoomId } = useStore();
  let shareLink;
  if (process.env.NODE_ENV === "development") {
    shareLink = `http://localhost:3000/sim/mobile/${currentRoomId}`;
  } else {
    shareLink = `https://wheretoput.store/sim/mobile/${currentRoomId}`;
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      alert("링크가 복사되었습니다!");
    } catch (err) {
      console.error("복사 실패:", err);
      alert("링크 복사에 실패했습니다.");
    }
  };

  const iconStyle = {
    position: "fixed",
    top: "10px",
    background: "rgba(0, 0, 0, 0.7)",
    color: "white",
    border: "none",
    borderRadius: "5px",
    width: "40px",
    height: "40px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    zIndex: 101,
    transition: "background 0.2s ease",
  };

  const hoverStyle = {
    background: "rgba(0,0,0,0.9)",
  };

  const popupOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.3)",
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const popupContentStyle = {
    position: "relative",
    background: "rgba(0,0,0,0.9)",
    borderRadius: "10px",
    padding: "0",
    maxWidth: "90vw",
    maxHeight: "90vh",
    overflow: "hidden",
  };

  const closeButtonStyle = {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "rgba(255,255,255,0.2)",
    border: "none",
    color: "white",
    borderRadius: "50%",
    width: "25px",
    height: "25px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    zIndex: 210,
  };

  function setAllPopupFalse() {
    setShowControlPopup(false);
    setShowLightPopup(false);
    setShowCameraPopup(false);
    setShowColorPopup(false);
    setShowCapturePopup(false);
    setShowSharePopup(false);
    setShowHelpPopup(false);
  }

  return (
    <>
      {/* 방 상태 저장 , 모든가구 제거 패널 */}
      <button
        style={{
          ...iconStyle,
          width: "60px",
          right: "20px",
          fontSize: "16px",
        }}
        onClick={() => {
          setAllPopupFalse();
          setShowControlPopup(true);
        }}
        onMouseEnter={(e) =>
          (e.target.style.background = hoverStyle.background)
        }
        onMouseLeave={(e) => (e.target.style.background = iconStyle.background)}
        title="저장하기"
      >
        저장
      </button>

      {/* Light Control Icon - 저장 버튼 왼쪽 */}
      <button
        style={{
          ...iconStyle,
          right: "90px",
        }}
        onClick={() => {
          setAllPopupFalse();
          setShowLightPopup(true);
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = hoverStyle.background)
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = iconStyle.background)
        }
        title="조명 설정"
      >
        <MdSunny />
      </button>

      {/* Camera Control Icon - 조명 버튼 왼쪽 */}
      <button
        style={{
          ...iconStyle,
          right: "140px",
        }}
        onClick={() => {
          setAllPopupFalse();
          setShowCameraPopup(true);
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = hoverStyle.background)
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = iconStyle.background)
        }
        title="카메라 설정"
      >
        <FaCameraRetro />
      </button>

      {/* Color Control Icon - 카메라 버튼 왼쪽 */}
      <button
        style={{
          ...iconStyle,
          right: "190px",
        }}
        onClick={() => {
          setAllPopupFalse();
          setShowColorPopup(true);
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = hoverStyle.background)
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = iconStyle.background)
        }
        title="색상 설정"
      >
        <FaPalette />
      </button>

      {/* Capture Control Icon - 색상 버튼 왼쪽 */}
      <button
        style={{
          ...iconStyle,
          right: "240px",
        }}
        onClick={() => {
          setAllPopupFalse();
          setShowCapturePopup(true);
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = hoverStyle.background)
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = iconStyle.background)
        }
        title="화면 캡쳐"
      >
        <TbScreenshot />
      </button>

      {/* Share Control Icon - 캡쳐 버튼 왼쪽 */}
      <button
        style={{
          ...iconStyle,
          right: "290px",
        }}
        onClick={() => {
          setAllPopupFalse();
          setShowSharePopup(true);
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = hoverStyle.background)
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = iconStyle.background)
        }
        title="공유하기"
      >
        <FaShareAlt />
      </button>

      <button
        style={{
          position: "fixed",
          top: "10px",
          right: "330px",
          background: "rgba(0, 0, 0, 0)",
          color: "black",
          border: "none",
          width: "40px",
          height: "40px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          zIndex: 101,
        }}
        onClick={() => {
          setAllPopupFalse();
          setShowHelpPopup(true);
        }}
        title="도움말"
      >
        <MdHelp />
      </button>

      {/* Control Panel 팝업 결정 */}
      {showControlPopup && (
        <div
          style={popupOverlayStyle}
          onClick={() => setShowControlPopup(false)}
        >
          <div style={popupContentStyle} onClick={(e) => e.stopPropagation()}>
            <button
              style={closeButtonStyle}
              onClick={() => setShowControlPopup(false)}
              title="닫기"
            >
              ×
            </button>
            <div style={{ position: "static", background: "transparent" }}>
              <ControlPanel isPopup={true} />
            </div>
          </div>
        </div>
      )}

      {/* Light Control Popup */}
      {showLightPopup && (
        <div
          style={{
            position: "fixed",
            top: "60px",
            right: "90px",
            zIndex: 200,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={popupContentStyle} onClick={(e) => e.stopPropagation()}>
            <button
              style={closeButtonStyle}
              onClick={() => setShowLightPopup(false)}
              title="닫기"
            >
              ×
            </button>
            <div style={{ position: "static", background: "transparent" }}>
              <LightControlPanel isPopup={true} />
            </div>
          </div>
        </div>
      )}

      {/* Camera Control Popup */}
      {showCameraPopup && (
        <div
          style={{
            position: "fixed",
            top: "60px",
            right: "140px", // 오른쪽으로부터 140px
            zIndex: 200,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={popupContentStyle} onClick={(e) => e.stopPropagation()}>
            <button
              style={closeButtonStyle}
              onClick={() => setShowCameraPopup(false)}
              title="닫기"
            >
              ×
            </button>
            <div style={{ position: "static", background: "transparent" }}>
              <CameraControlPanel isPopup={true} controlsRef={controlsRef} />
            </div>
          </div>
        </div>
      )}

      {/* Color Control Popup */}
      {showColorPopup && (
        <div
          style={{
            position: "fixed",
            top: "60px",
            right: "190px",
            zIndex: 200,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={popupContentStyle} onClick={(e) => e.stopPropagation()}>
            <button
              style={closeButtonStyle}
              onClick={() => setShowColorPopup(false)}
              title="닫기"
            >
              ×
            </button>
            <div style={{ position: "static", background: "transparent" }}>
              <ColorControlPanel isPopup={true} />
            </div>
          </div>
        </div>
      )}

      {/* Capture Control Popup */}
      {showCapturePopup && (
        <div
          style={{
            position: "fixed",
            top: "60px",
            right: "240px",
            zIndex: 200,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={popupContentStyle} onClick={(e) => e.stopPropagation()}>
            <button
              style={closeButtonStyle}
              onClick={() => setShowCapturePopup(false)}
              title="닫기"
            >
              ×
            </button>
            <div style={{ position: "static", background: "transparent" }}>
              <CaptureControlPanel isPopup={true} />
            </div>
          </div>
        </div>
      )}

      {/* Share Control Popup */}
      {showSharePopup && (
        <div
          className="fixed inset-0 bg-black/30 z-[200] flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="relative bg-black/90 rounded-lg p-8 w-[400px] max-w-[90vw] max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={closeButtonStyle}
              onClick={() => setShowSharePopup(false)}
              title="닫기"
            >
              ×
            </button>

            {/* 공유 팝업 내용 */}
            <div className="text-white text-center ">
              <h3 className="mb-5 text-lg font-semibold"></h3>

              {/* QR 코드 영역 */}
              <div className="w-[250px] h-[250px] border-2 border-dashed border-gray-600 mx-auto mb-8 flex items-center justify-center bg-white/10 rounded-xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${shareLink}`}
                  className="w-[230px] h-[230px] rounded-lg"
                  alt="QR 코드"
                />
              </div>

              {/* 링크 복사 버튼 */}
              <div className="flex justify-center">
                <button
                  onClick={copyToClipboard}
                  className="tool-btn tool-btn-green-active w-[230px] p-4 !text-lg font-bold mb-5"
                  style={{ transform: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'none'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                >
                  링크 복사
                </button>
              </div>

              {/* 링크 표시 */}
              <div className="mt-1 p-3 bg-white/10 rounded text-xs break-all text-gray-300">
                {shareLink}
              </div>
            </div>
          </div>
        </div>
      )}

      {showHelpPopup && (
        <div
          className="fixed inset-0 bg-black/30 z-[200] flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="relative bg-black/90 rounded-lg p-8 w-[500px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={closeButtonStyle}
              onClick={() => setShowHelpPopup(false)}
              title="닫기"
            >
              ×
            </button>

            <HelpPopup />
          </div>
        </div>
      )}
    </>
  );
}
