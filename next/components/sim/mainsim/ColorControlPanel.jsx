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
    setBackgroundColor
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
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}><span className="text-lg">🎨</span> 색상 세팅</h3>

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
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white">색상 대상</span>
          <div className="flex bg-gray-200 rounded-lg overflow-hidden">
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
          <div>
            <p className="text-sm mb-1">{colorTarget === 'wall' ? '벽' : colorTarget === 'floor' ? '바닥' : '배경'} 색상</p>
            <HexColorPicker style={{ width: '100%', height: '120px' }} color={colorTarget === 'wall' ? wallColor : colorTarget === 'floor' ? floorColor : backgroundColor} onChange={colorTarget === 'wall' ? setWallColor : colorTarget === 'floor' ? setFloorColor : setBackgroundColor} />
          </div>
        </div>
      </div>

    </div>
  )
}