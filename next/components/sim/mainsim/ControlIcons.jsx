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

  const iconStyle = {
    position: 'fixed',
    top: '10px',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    width: '60px', // "저장" 텍스트에 맞게 조정
    height: '35px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    zIndex: 101,
    transition: 'background 0.2s ease',
    padding: '0 8px' // 좌우 여백 추가
  };

  const bottomIconStyle = {
    position: 'fixed',
    bottom: '20px',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    zIndex: 101,
    transition: 'background 0.2s ease'
  };

  const hoverStyle = {
    background: 'rgba(0,0,0,0.9)'
  };

  const popupOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.3)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const popupContentStyle = {
    position: 'relative',
    background: 'rgba(0,0,0,0.9)',
    borderRadius: '10px',
    padding: '0',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'hidden'
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    borderRadius: '50%',
    width: '25px',
    height: '25px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    zIndex: 210
  };

  return (
    <>
      {/* 방 상태 저장 , 모든가구 제거 패널 */}
      <button
        style={{
          ...iconStyle,
          right: '20px',
          height: '40px',
          fontSize: '16px'
        }}
        onClick={() => {
          setShowControlPopup(true);
          setShowLightPopup(false);
          setShowCameraPopup(false);
          setShowColorPopup(false);
          setShowCapturePopup(false);
        }}
        onMouseEnter={(e) => e.target.style.background = hoverStyle.background}
        onMouseLeave={(e) => e.target.style.background = iconStyle.background}
        title="저장하기"
      >
        저장
      </button>

      {/* Light Control Icon - 저장 버튼 왼쪽 */}
      <button
        style={{
          ...bottomIconStyle,
          top: '10px',
          right: '90px',
          bottom: 'auto'
        }}
        onClick={() => {
          setShowControlPopup(false);
          setShowLightPopup(true);
          setShowCameraPopup(false);
          setShowColorPopup(false);
          setShowCapturePopup(false);
        }}
        onMouseEnter={(e) => e.target.style.background = hoverStyle.background}
        onMouseLeave={(e) => e.target.style.background = bottomIconStyle.background}
        title="조명 설정"
      >
        <MdSunny></MdSunny>
      </button>

      {/* Camera Control Icon - 조명 버튼 왼쪽 */}
      <button
        style={{
          ...bottomIconStyle,
          top: '10px',
          right: '140px',
          bottom: 'auto'
        }}
        onClick={() => {
          setShowControlPopup(false);
          setShowLightPopup(false);
          setShowCameraPopup(true);
          setShowColorPopup(false);
          setShowCapturePopup(false);
        }}
        onMouseEnter={(e) => e.target.style.background = hoverStyle.background}
        onMouseLeave={(e) => e.target.style.background = bottomIconStyle.background}
        title="카메라 설정"
      >
        <FaCameraRetro />
      </button>

      {/* Color Control Icon - 카메라 버튼 왼쪽 */}
      <button
        style={{
          ...bottomIconStyle,
          top: '10px',
          right: '190px',
          bottom: 'auto'
        }}
        onClick={() => {
          setShowControlPopup(false);
          setShowLightPopup(false);
          setShowCameraPopup(false);
          setShowColorPopup(true);
          setShowCapturePopup(false);
        }}
        onMouseEnter={(e) => e.target.style.background = hoverStyle.background}
        onMouseLeave={(e) => e.target.style.background = bottomIconStyle.background}
        title="색상 설정"
      >
        <FaPalette />
      </button>

      {/* Capture Control Icon - 색상 버튼 왼쪽 */}
      <button
        style={{
          ...bottomIconStyle,
          top: '10px',
          right: '240px',
          bottom: 'auto'
        }}
        onClick={() => {
          setShowControlPopup(false);
          setShowLightPopup(false);
          setShowCameraPopup(false);
          setShowColorPopup(false);
          setShowCapturePopup(true);
        }}
        onMouseEnter={(e) => e.target.style.background = hoverStyle.background}
        onMouseLeave={(e) => e.target.style.background = bottomIconStyle.background}
        title="화면 캡쳐"
      >
        <TbScreenshot /> 
      </button>

      {/* Control Panel 팝업 결정 */}
      {showControlPopup && (
        <div style={popupOverlayStyle} onClick={() => setShowControlPopup(false)}>
          <div style={popupContentStyle} onClick={(e) => e.stopPropagation()}>
            <button 
              style={closeButtonStyle}
              onClick={() => setShowControlPopup(false)}
              title="닫기"
            >
              ×
            </button>
            <div style={{ position: 'static', background: 'transparent' }}>
              <ControlPanel isPopup={true} />
            </div>
          </div>
        </div>
      )}


      {/* Light Control Popup */}
      {showLightPopup && (
        <div 
          style={{
            position: 'fixed',
            top: '60px',
            right: '90px',
            zIndex: 200
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
            <div style={{ position: 'static', background: 'transparent' }}>
              <LightControlPanel isPopup={true} />
            </div>
          </div>
        </div>
      )}

      {/* Camera Control Popup */}
      {showCameraPopup && (
        <div 
          style={{
            position: 'fixed',
            top: '60px',
            right: '140px', // 오른쪽으로부터 140px
            zIndex: 200
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
            <div style={{ position: 'static', background: 'transparent' }}>
              <CameraControlPanel isPopup={true} />
            </div>
          </div>
        </div>
      )}

      {/* Color Control Popup */}
      {showColorPopup && (
        <div 
          style={{
            position: 'fixed',
            top: '60px',
            right: '190px',
            zIndex: 200
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
            <div style={{ position: 'static', background: 'transparent' }}>
              <ColorControlPanel isPopup={true} />
            </div>
          </div>
        </div>
      )}

      {/* Capture Control Popup */}
      {showCapturePopup && (
        <div 
          style={{
            position: 'fixed',
            top: '60px',
            right: '240px',
            zIndex: 200
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
            <div style={{ position: 'static', background: 'transparent' }}>
              <CaptureControlPanel isPopup={true} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}