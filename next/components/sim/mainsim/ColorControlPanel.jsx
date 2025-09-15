import React from "react";
import { useStore } from '@/components/sim/useStore';
import { HexColorPicker } from "react-colorful";


export function ColorControlPanel({ isPopup = false }) {
  const {
    wallColor,
    floorColor,
    backgroundColor,
    setWallColor,
    setFloorColor,
    setBackgroundColor,
    floorTexture,
    floorTexturePresets,
    setFloorTexture
  } = useStore();
  const [colorTarget, setColorTarget] = React.useState('wall'); // 'wall' | 'floor' | 'background'

  const baseStyle = {
    background: 'rgba(0,0,0,0.7)',
    padding: '15px',
    borderRadius: '5px',
    color: 'white',
    fontSize: '13px',
    width: '250px',
    maxHeight: '400px',
    overflowY: 'auto'
  };

  const positionStyle = isPopup ?
    { position: 'static' } :
    { position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '10px', zIndex: 100 };

  return (
    <div style={{
      ...baseStyle,
      ...positionStyle
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}> Colors </h3>

      <div
        style={{
          background: 'rgba(255,255,255,0.1)',
          margin: '5px 0',
          padding: '8px',
          borderRadius: '3px',
          border: '1px solid rgba(255,255,255,0.2)',
          cursor: 'default'
        }}
      >
        <div className="flex items-center justify-center mb-3">
          <div className="flex justify-center bg-gray-200 rounded-lg overflow-hidden my-2">
            <button
              className={`px-3 py-1 text-xs transition-colors cursor-pointer ${colorTarget === "wall"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-300"
                }`}
              onClick={() => setColorTarget("wall")}
            >
              벽
            </button>
            <button
              className={`px-3 py-1 text-xs transition-colors cursor-pointer ${colorTarget === "floor"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-300"
                }`}
              onClick={() => setColorTarget("floor")}
            >
              바닥
            </button>
            <button
              className={`px-3 py-1 text-xs transition-colors cursor-pointer ${colorTarget === "background"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-300"
                }`}
              onClick={() => setColorTarget("background")}
            >
              배경
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {/* 바닥 옵션 클릭시  바닥재 옵션 표시 */}
          {colorTarget === 'floor' && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '14px', marginBottom: '8px', color: 'white' }}>바닥재 타입</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>

                {/* 동적으로 여러개의 바닥재 UI 생성 */}
                {Object.entries(floorTexturePresets).map(([key, preset]) => (
                  <button
                    key={key}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '4px',
                      background: floorTexture === key ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255,255,255,0.1)',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setFloorTexture(key)}
                    onMouseEnter={(e) => {
                      if (floorTexture !== key) {
                        e.target.style.background = 'rgba(255,255,255,0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (floorTexture !== key) {
                        e.target.style.background = 'rgba(255,255,255,0.1)';
                      }
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 색상 선택 - 단색 모드에서만 표시 */}
          {(colorTarget !== 'floor' || floorTexture === 'color') && (
            <div>
              <HexColorPicker
                // className="border-5 rounded-2xl" // 보더 필요 여부에 따라 수정
                style={{
                  width: '100%',
                  height: '120px'
                }}
                color={colorTarget === 'wall' ? wallColor : colorTarget === 'floor' ? floorColor : backgroundColor}
                onChange={colorTarget === 'wall' ? setWallColor : colorTarget === 'floor' ? setFloorColor : setBackgroundColor} />
            </div>
          )}

          {/* 텍스처 모드에서 색상 픽커 대신 안내 메시지 */}
          {colorTarget === 'floor' && floorTexture !== 'color' && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                {floorTexturePresets[floorTexture].name} 텍스처가 적용됩니다
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '5px' }}>
                실제 텍스처 파일을 추가하면 더 현실적인 효과를 볼 수 있습니다
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}