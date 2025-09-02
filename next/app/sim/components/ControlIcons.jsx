import React, { useState } from 'react';
import { LightControlPanel } from './LightControlPanel.jsx';
import { CameraControlPanel } from './CameraControlPanel.jsx';
import { ControlPanel } from './ControlPanel.jsx';

// react-icons 추가 부분
import { FaCameraRetro } from "react-icons/fa";
import { MdSunny } from "react-icons/md";
import { FaSave } from "react-icons/fa";
// =====================================
export function ControlIcons() {
  const [showLightPopup, setShowLightPopup] = useState(false);
  const [showCameraPopup, setShowCameraPopup] = useState(false);
  const [showControlPopup, setShowControlPopup] = useState(false);

  const iconStyle = {
    position: 'fixed',
    top: '10px',
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
          right: '120px'
        }}
        onClick={() => setShowControlPopup(true)}
        onMouseEnter={(e) => e.target.style.background = hoverStyle.background}
        onMouseLeave={(e) => e.target.style.background = iconStyle.background}
        title="컨트롤 패널"
      >
        <FaSave></FaSave>
      </button>

      {/* Light Control Icon */}
      <button
        style={{
          ...iconStyle,
          right: '70px'
        }}
        onClick={() => setShowLightPopup(true)}
        onMouseEnter={(e) => e.target.style.background = hoverStyle.background}
        onMouseLeave={(e) => e.target.style.background = iconStyle.background}
        title="조명 설정"
      >
        <MdSunny></MdSunny>
      </button>

      {/* Camera Control Icon */}
      <button
        style={{
          ...iconStyle,
          right: '20px'
        }}
        onClick={() => setShowCameraPopup(true)}
        onMouseEnter={(e) => e.target.style.background = hoverStyle.background}
        onMouseLeave={(e) => e.target.style.background = iconStyle.background}
        title="카메라 설정"
      >
        <FaCameraRetro />
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
        <div style={popupOverlayStyle} onClick={() => setShowLightPopup(false)}>
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
        <div style={popupOverlayStyle} onClick={() => setShowCameraPopup(false)}>
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
    </>
  );
}