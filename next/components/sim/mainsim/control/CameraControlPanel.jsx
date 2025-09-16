import React from "react";
import { useStore } from "@/components/sim/useStore";
import { RotateCcw } from "lucide-react";
import { calculateWallsCenter, calculateOptimalCameraPosition, getCameraTarget } from "@/utils/cameraUtils";
import * as THREE from "three";


export function CameraControlPanel({ isPopup = false, controlsRef }) {
  const {
    enableWallTransparency,
    enableWallMagnet,
    cameraFov,
    cameraZoom,
    cameraMode,
    setEnableWallTransparency,
    setEnableWallMagnet,
    setCameraFov,
    setCameraZoom,
    setCameraMode,
    wallsData,
  } = useStore();

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
      <h3 style={{ margin: "0 0 10px 0", fontSize: "20px" }}
      className="m-0 mb-2.5 text-xl font-semibold">
        Display
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
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <WallTransparencyToggle
            enabled={enableWallTransparency}
            onToggle={setEnableWallTransparency}
          />
          <WallMagnetToggle
            enabled={enableWallMagnet}
            onToggle={setEnableWallMagnet}
          />
          <ControlSlider
            label="시야각"
            value={cameraFov}
            min={5}
            max={90}
            step={1}
            onChange={setCameraFov}
            displayValue={cameraFov}
          />
          <CameraResetButton controlsRef={controlsRef} wallsData={wallsData} />
        </div>

        {/* <button onClick={() => setCameraMode(cameraMode === "perspective" ? "orthographic" : "perspective")}>
          {cameraMode === "perspective" ? "직교" : "투시"} 모드로 변경하기
        </button> */}
      </div>
    </div>
  );
}

function ControlSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayValue,
}) {
  return (

    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "3px",
      }} 
    >
      <span
        style={{
          minWidth: "50px",
          fontSize: "13px",
          fontWeight: "bold",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider-small"
        style={{ flex: 1 }}
      />
      <span
        style={{
          color: "#ffffff",
          minWidth: "20px",
          fontSize: "11px",
          textAlign: "right",
        }}
      >
        {displayValue}
      </span>
    </div>
  );
}

function WallTransparencyToggle({ enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-s text-white font-bold my-1">벽 투명화</span>
      <button
        onClick={() => onToggle(!enabled)}
        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
          enabled ? "bg-blue-500" : "bg-gray-300"
        }`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
            enabled ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function WallMagnetToggle({ enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-s text-white font-bold">벽 자석</span>
      <button
        onClick={() => onToggle(!enabled)}
        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
          enabled ? "bg-blue-500" : "bg-gray-300"
        }`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
            enabled ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function CameraResetButton({ controlsRef, wallsData }) {
  const handleReset = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      
      // Calculate centered position based on current walls
      const wallsCenter = calculateWallsCenter(wallsData);
      const optimalPosition = calculateOptimalCameraPosition(wallsCenter, wallsData);
      const target = getCameraTarget(wallsCenter);
      
      // Reset camera to centered position
      controls.object.position.set(...optimalPosition);
      controls.target.set(...target);
      controls.update();
    }
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
    }}>
      <button
        onClick={handleReset}
        className="tool-btn tool-btn-red-active mt-2"
      >
        <span className="flex items-center gap-2">
          Reset <RotateCcw size={18} />
        </span>
      </button>
    </div>
  );
}
