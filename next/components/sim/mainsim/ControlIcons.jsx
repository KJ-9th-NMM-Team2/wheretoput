import React, { useState } from 'react';
import { ControlPanel } from '@/components/sim/mainsim/ControlPanel';
import { LightControlPanel } from '@/components/sim/mainsim/LightControlPanel';
import { CameraControlPanel } from '@/components/sim/mainsim/CameraControlPanel';
import { ColorControlPanel } from '@/components/sim/mainsim/ColorControlPanel';
import { CaptureControlPanel } from '@/components/sim/mainsim/CaptureControlPanel';

// react-icons 추가 부분
import { FaCameraRetro, FaPalette, FaCamera } from "react-icons/fa";
import { MdSunny } from "react-icons/md";
import { FaSave } from "react-icons/fa";
import { TbScreenshot } from "react-icons/tb";
// =====================================

export function ControlIcons() {
  const [showControlPopup, setShowControlPopup] = useState(false);
  const [showLightPopup, setShowLightPopup] = useState(false);
  const [showCameraPopup, setShowCameraPopup] = useState(false);
  const [showColorPopup, setShowColorPopup] = useState(false);
  const [showCapturePopup, setShowCapturePopup] = useState(false);

  // 공통 스타일 클래스들
  const baseIconStyle = "fixed top-[10px] bg-black/70 text-white border-none rounded-[5px] cursor-pointer flex items-center justify-center z-[101] transition-all duration-200 ease-in-out hover:bg-black/90";
  const saveButtonStyle = `${baseIconStyle} right-[20px] w-[60px] h-[40px] text-base px-2`;
  const controlIconStyle = `${baseIconStyle} w-[40px] h-[40px] text-lg`;
  const popupContainerStyle = "relative bg-black/90 rounded-[10px] p-0 max-w-[90vw] max-h-[90vh] overflow-hidden";
  const closeButtonStyle = "absolute top-[10px] right-[10px] bg-white/20 border-none text-white rounded-full w-[25px] h-[25px] cursor-pointer flex items-center justify-center text-sm z-[210]";
  const popupContentStyle = "static bg-transparent";

  return (
    <>
      {/* 방 상태 저장 , 모든가구 제거 패널 */}
      <button
        className={saveButtonStyle}
        onClick={() => {
          setShowControlPopup(true);
          setShowLightPopup(false);
          setShowCameraPopup(false);
          setShowColorPopup(false);
          setShowCapturePopup(false);
        }}
        title="저장하기"
      >
        저장
      </button>

      {/* Light Control Icon - 저장 버튼 왼쪽 */}
      <button
        className={`${controlIconStyle} right-[90px]`}
        onClick={() => {
          setShowControlPopup(false);
          setShowLightPopup(true);
          setShowCameraPopup(false);
          setShowColorPopup(false);
          setShowCapturePopup(false);
        }}
        title="조명 설정"
      >
        <MdSunny />
      </button>

      {/* Camera Control Icon - 조명 버튼 왼쪽 */}
      <button
        className={`${controlIconStyle} right-[140px]`}
        onClick={() => {
          setShowControlPopup(false);
          setShowLightPopup(false);
          setShowCameraPopup(true);
          setShowColorPopup(false);
          setShowCapturePopup(false);
        }}
        title="카메라 설정"
      >
        <FaCameraRetro />
      </button>

      {/* Color Control Icon - 카메라 버튼 왼쪽 */}
      <button
        className={`${controlIconStyle} right-[190px]`}
        onClick={() => {
          setShowControlPopup(false);
          setShowLightPopup(false);
          setShowCameraPopup(false);
          setShowColorPopup(true);
          setShowCapturePopup(false);
        }}
        title="색상 설정"
      >
        <FaPalette />
      </button>

      {/* Capture Control Icon - 색상 버튼 왼쪽 */}
      <button
        className={`${controlIconStyle} right-[240px]`}
        onClick={() => {
          setShowControlPopup(false);
          setShowLightPopup(false);
          setShowCameraPopup(false);
          setShowColorPopup(false);
          setShowCapturePopup(true);
        }}
        title="화면 캡쳐"
      >
        <TbScreenshot /> 
      </button>

      {/* Control Panel 팝업 결정 */}
      {showControlPopup && (
        <div className="fixed inset-0 bg-black/30 z-[200] flex items-center justify-center" onClick={() => setShowControlPopup(false)}>
          <div className={popupContainerStyle} onClick={(e) => e.stopPropagation()}>
            <button 
              className={closeButtonStyle}
              onClick={() => setShowControlPopup(false)}
              title="닫기"
            >
              ×
            </button>
            <div className={popupContentStyle}>
              <ControlPanel isPopup={true} />
            </div>
          </div>
        </div>
      )}

      {/* Light Control Popup */}
      {showLightPopup && (
        <div 
          className="fixed top-[60px] right-[90px] z-[200]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={popupContainerStyle} onClick={(e) => e.stopPropagation()}>
            <button 
              className={closeButtonStyle}
              onClick={() => setShowLightPopup(false)}
              title="닫기"
            >
              ×
            </button>
            <div className={popupContentStyle}>
              <LightControlPanel isPopup={true} />
            </div>
          </div>
        </div>
      )}

      {/* Camera Control Popup */}
      {showCameraPopup && (
        <div 
          className="fixed top-[60px] right-[140px] z-[200]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={popupContainerStyle} onClick={(e) => e.stopPropagation()}>
            <button 
              className={closeButtonStyle}
              onClick={() => setShowCameraPopup(false)}
              title="닫기"
            >
              ×
            </button>
            <div className={popupContentStyle}>
              <CameraControlPanel isPopup={true} />
            </div>
          </div>
        </div>
      )}

      {/* Color Control Popup */}
      {showColorPopup && (
        <div 
          className="fixed top-[60px] right-[190px] z-[200]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={popupContainerStyle} onClick={(e) => e.stopPropagation()}>
            <button 
              className={closeButtonStyle}
              onClick={() => setShowColorPopup(false)}
              title="닫기"
            >
              ×
            </button>
            <div className={popupContentStyle}>
              <ColorControlPanel isPopup={true} />
            </div>
          </div>
        </div>
      )}

      {/* Capture Control Popup */}
      {showCapturePopup && (
        <div 
          className="fixed top-[60px] right-[240px] z-[200]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={popupContainerStyle} onClick={(e) => e.stopPropagation()}>
            <button 
              className={closeButtonStyle}
              onClick={() => setShowCapturePopup(false)}
              title="닫기"
            >
              ×
            </button>
            <div className={popupContentStyle}>
              <CaptureControlPanel isPopup={true} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}