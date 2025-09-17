import React from "react";
import { useStore } from "@/components/sim/useStore";
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
    setFloorTexture,
    wallTexture,
    wallTexturePresets,
    setWallTexture,
  } = useStore();
  const [colorTarget, setColorTarget] = React.useState("wall"); // 'wall' | 'floor' | 'background'
  const [originalColors, setOriginalColors] = React.useState({
    wall: wallColor,
    floor: floorColor
  });
  const [isBlackFromOriginal, setIsBlackFromOriginal] = React.useState({
    wall: false,
    floor: false
  });

  const baseStyle = {
    background: "rgba(0,0,0,0.7)",
    padding: "15px",
    borderRadius: "5px",
    color: "white",
    fontSize: "13px",
    width: "250px",
    maxHeight: "400px",
    overflowY: "auto",
  };

  const positionStyle = isPopup
    ? { position: "static" }
    : {
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        left: "10px",
        zIndex: 100,
      };

  return (
    <div
      style={{
        ...baseStyle,
        ...positionStyle,
      }}
    >
      <h3
        style={{ margin: "0 0 10px 0", fontSize: "20px" }}
        className="m-0 mb-2.5 text-xl font-semibold"
      >
        {" "}
        Colors{" "}
      </h3>

      <div
        style={{
          background: "rgba(255,255,255,0.1)",
          margin: "5px 0",
          padding: "8px",
          borderRadius: "3px",
          border: "1px solid rgba(255,255,255,0.2)",
          cursor: "default",
        }}
      >
        <div className="flex items-center justify-center mt-1 mb-2">
          <div className="flex justify-center bg-gray-200 rounded-lg overflow-hidden">
            <button
              className={`px-3 py-1 text-xs transition-colors cursor-pointer ${
                colorTarget === "wall"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-gray-300"
              }`}
              onClick={() => setColorTarget("wall")}
            >
              벽
            </button>
            <button
              className={`px-3 py-1 text-xs transition-colors cursor-pointer ${
                colorTarget === "floor"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-gray-300"
              }`}
              onClick={() => setColorTarget("floor")}
            >
              바닥
            </button>
            <button
              className={`px-3 py-1 text-xs transition-colors cursor-pointer ${
                colorTarget === "background"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-gray-300"
              }`}
              onClick={() => setColorTarget("background")}
            >
              배경
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {/* 벽 옵션 클릭시 벽지 옵션 표시 */}
          {colorTarget === "wall" && (
            <div style={{ marginBottom: "10px" }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  color: "white",
                }}
              >
                벽지 타입
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {/* [09.15] 동적으로 여러개의 벽지 UI 생성 */}
                {Object.entries(wallTexturePresets).map(([key, preset]) => (
                  <button
                    key={key}
                    style={{
                      padding: "4px 8px",
                      fontSize: "12px",
                      border: "1px solid rgba(255,255,255,0.3)",
                      borderRadius: "4px",
                      background:
                        wallTexture === key
                          ? "rgba(59, 130, 246, 0.8)"
                          : "rgba(255,255,255,0.1)",
                      color: "white",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onClick={() => {
                      // 단색으로 전환할 때 원본질감 상태 확인 후 원래 색상 복원
                      if (key === 'color' && isBlackFromOriginal.wall && wallColor === '#000000') {
                        setWallColor(originalColors.wall);
                        setIsBlackFromOriginal(prev => ({ ...prev, wall: false }));
                      }
                      setWallTexture(key);
                    }}
                    onMouseEnter={(e) => {
                      if (wallTexture !== key) {
                        e.target.style.background = "rgba(255,255,255,0.2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (wallTexture !== key) {
                        e.target.style.background = "rgba(255,255,255,0.1)";
                      }
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 바닥 옵션 클릭시  바닥재 옵션 표시 */}
          {colorTarget === "floor" && (
            <div style={{ marginBottom: "10px" }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  color: "white",
                }}
              >
                바닥재 타입
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {/*[09.15] 동적으로 여러개의 바닥재 UI 생성 */}
                {Object.entries(floorTexturePresets).map(([key, preset]) => (
                  <button
                    key={key}
                    style={{
                      padding: "4px 8px",
                      fontSize: "12px",
                      border: "1px solid rgba(255,255,255,0.3)",
                      borderRadius: "4px",
                      background:
                        floorTexture === key
                          ? "rgba(59, 130, 246, 0.8)"
                          : "rgba(255,255,255,0.1)",
                      color: "white",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onClick={() => {
                      // 단색으로 전환할 때 원본질감 상태 확인 후 원래 색상 복원
                      if (key === 'color' && isBlackFromOriginal.floor && floorColor === '#000000') {
                        setFloorColor(originalColors.floor);
                        setIsBlackFromOriginal(prev => ({ ...prev, floor: false }));
                      }
                      setFloorTexture(key);
                    }}
                    onMouseEnter={(e) => {
                      if (floorTexture !== key) {
                        e.target.style.background = "rgba(255,255,255,0.2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (floorTexture !== key) {
                        e.target.style.background = "rgba(255,255,255,0.1)";
                      }
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 색상 선택 - 배경은 항상, 벽과 바닥은 텍스처와 함께 조합 가능 */}
          {(colorTarget === "background" ||
            colorTarget === "wall" ||
            colorTarget === "floor") && (
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  color: "white",
                }}
              >
                {colorTarget === "background"
                  ? "배경색"
                  : colorTarget === "wall"
                  ? wallTexture === "color"
                    ? "벽 색상"
                    : "벽 색상 (텍스처와 조합)"
                  : floorTexture === "color"
                  ? "바닥 색상"
                  : "바닥 색상 (텍스처와 조합)"}
              </div>
              <HexColorPicker
                // className="border-5 rounded-2xl" // 보더 필요 여부에 따라 수정
                style={{
                  width: "100%",
                  height: "120px",
                }}
                color={
                  colorTarget === "wall"
                    ? wallColor
                    : colorTarget === "floor"
                    ? floorColor
                    : backgroundColor
                }
                onChange={(color) => {
                  // 색상 변경 시 원본질감 상태 해제
                  if (colorTarget === "wall") {
                    if (color !== '#000000') {
                      setOriginalColors(prev => ({ ...prev, wall: color }));
                      setIsBlackFromOriginal(prev => ({ ...prev, wall: false }));
                    }
                    setWallColor(color);
                  } else if (colorTarget === "floor") {
                    if (color !== '#000000') {
                      setOriginalColors(prev => ({ ...prev, floor: color }));
                      setIsBlackFromOriginal(prev => ({ ...prev, floor: false }));
                    }
                    setFloorColor(color);
                  } else {
                    setBackgroundColor(color);
                  }
                }}
              />
            </div>
          )}

          {/* 질감 모드일 때 색 없애기 버튼 추가 */}
          {((colorTarget === "wall" && wallTexture !== "color") ||
            (colorTarget === "floor" && floorTexture !== "color")) && (
            <div style={{ marginTop: "10px" }}>
              <button
                style={{
                  padding: "4px 8px",
                  fontSize: "12px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "4px",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onClick={() => {
                  if (colorTarget === "wall") {
                    // 원본 색상 저장하고 원본질감 상태 설정
                    setOriginalColors(prev => ({ ...prev, wall: wallColor }));
                    setIsBlackFromOriginal(prev => ({ ...prev, wall: true }));
                    setWallColor("#000000");
                  } else if (colorTarget === "floor") {
                    // 원본 색상 저장하고 원본질감 상태 설정
                    setOriginalColors(prev => ({ ...prev, floor: floorColor }));
                    setIsBlackFromOriginal(prev => ({ ...prev, floor: true }));
                    setFloorColor("#000000");
                  }
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(59, 130, 246, 0.8)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.1)";
                }}
              >
                원본 질감
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
