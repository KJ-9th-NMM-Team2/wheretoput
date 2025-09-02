import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore.js";
import { useSession } from "next-auth/react";

const handleSave = async () => {
  if (!currentRoomId) {
    setSaveMessage("방 ID가 설정되지 않았습니다.");
    setTimeout(() => setSaveMessage(""), 3000);
    return;
  }

  try {
    await saveSimulatorState();

    // 저장 완료 후 캔버스 캡처 트리거
    setShouldCapture(true);

    setSaveMessage(`저장 완료! (${loadedModels.length}개 가구)`);
    setTimeout(() => setSaveMessage(""), 3000);
  } catch (error) {
    setSaveMessage(`저장 실패: ${error.message}`);
    setTimeout(() => setSaveMessage(""), 5000);
  }
};

export function ControlPanel({ isPopup = false }) {
  const fileInputRef = useRef();
  const [saveMessage, setSaveMessage] = useState("");

  const {data: session, status} = useSession();

  const {
    scaleValue,
    setScaleValue,
    addModel,
    clearAllModels,
    saveSimulatorState,
    isSaving,
    currentRoomId,
    lastSavedAt,
    loadedModels,
    setShouldCapture,
    wallScaleFactor,
    setWallScaleFactor,
    loadSimulatorState,
    checkUserRoom,
    isOwnUserRoom
  } = useStore();

  useEffect(() => {
    const useCheckUserRoom = async () => {
      if (status === 'loading') return;
      if (!currentRoomId || !session?.user?.id) return;

      await checkUserRoom(currentRoomId, session?.user?.id);
    }
    useCheckUserRoom();
  }, [isOwnUserRoom, currentRoomId])

  // GLB 파일 업로드 처리
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);

    files.forEach((file) => {
      if (file.name.toLowerCase().endsWith(".glb")) {
        const url = URL.createObjectURL(file);

        const isCityKit =
          file.webkitRelativePath?.includes("city-kit-commercial") ||
          file.name.includes("building") ||
          file.name.includes("detail-");

        const newModel = {
          url: url,
          name: file.name,
          isCityKit: isCityKit,
          texturePath: isCityKit
            ? "./glb_asset/city-kit-commercial/Models/Textures/variation-b.png"
            : null,
        };

        addModel(newModel);
      } else {
        alert(`${file.name}은(는) GLB 파일이 아닙니다.`);
      }
    });

    event.target.value = "";
  };

  // 저장 처리
  const handleSave = async () => {
    if (!currentRoomId) {
      setSaveMessage("방 ID가 설정되지 않았습니다.");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    try {
      await saveSimulatorState();

      // 저장 완료 후 캔버스 캡처 트리거
      setShouldCapture(true);

      setSaveMessage(`저장 완료! (${loadedModels.length}개 가구)`);
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage(`저장 실패: ${error.message}`);
      setTimeout(() => setSaveMessage(""), 5000);
    }
  };

  const baseStyle = {
    background: "rgba(0,0,0,0.7)",
    padding: "15px",
    borderRadius: "5px",
    color: "white",
    fontSize: "12px",
    width: "250px",
  };

  const positionStyle = isPopup ? 
    { position: "static" } : 
    { position: "absolute", top: "10px", right: "10px", zIndex: 100 };

  return (
    <div
      style={{
        ...baseStyle,
        ...positionStyle
      }}
    >
      {/* 기본 스케일 설정 */}
      {/* <div style={{ marginBottom: "10px" }}>
        <label>새 가구 기본 크기:</label>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={scaleValue}
          onChange={(e) => setScaleValue(parseFloat(e.target.value))}
          style={{ width: "100%", margin: "5px 0" }}
        />
        <div style={{ color: "#4CAF50", textAlign: "center" }}>
          {scaleValue.toFixed(1)}x
        </div>
      </div> */}

      {/* 벽 스케일 설정 */}
      <div style={{ marginBottom: "10px" }}>
        <label>벽 크기 조정:</label>
        <input
          type="range"
          min="0.5"
          max="5.0"
          step="0.1"
          value={wallScaleFactor}
          onChange={(e) => {
            const newFactor = parseFloat(e.target.value);
            setWallScaleFactor(newFactor);
            // 현재 방 데이터를 다시 로드하여 새로운 스케일 적용
            if (currentRoomId) {
              loadSimulatorState(currentRoomId);
            }
          }}
          style={{ width: "100%", margin: "5px 0" }}
        />
        <div style={{ color: "#FF9800", textAlign: "center" }}>
          {wallScaleFactor.toFixed(1)}x
        </div>
      </div>

      {/* 저장 버튼 */}
      <div style={{ marginBottom: "10px" }}>
        <button
          onClick={handleSave}
          disabled={!isOwnUserRoom || !currentRoomId}
          style={{
            background: currentRoomId
              ? isSaving
                ? "#999"
                : isOwnUserRoom
                  ? "#4CAF50"
                  : "#999"
              : "#666",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "3px",
            cursor: currentRoomId && !isSaving ? "pointer" : "not-allowed",
            fontSize: "12px",
            width: "100%",
            marginBottom: "5px",
          }}
        >
          {isSaving ? "저장 중..." : isOwnUserRoom ? `방 상태 저장 (${loadedModels.length}개)` : `가구 개수 (${loadedModels.length}개)`}
        </button>

        {/* 저장 상태 메시지 */}
        {saveMessage && (
          <div
            style={{
              fontSize: "10px",
              color: saveMessage.includes("실패") ? "#ff4444" : "#4CAF50",
              textAlign: "center",
              marginBottom: "5px",
            }}
          >
            {saveMessage}
          </div>
        )}

        {/* 마지막 저장 시간 */}
        {isOwnUserRoom && lastSavedAt && (
          <div
            style={{
              fontSize: "9px",
              color: "#aaa",
              textAlign: "center",
              marginBottom: "5px",
            }}
          >
            마지막 저장: {lastSavedAt.toLocaleTimeString()}
          </div>
        )}
      </div>
      {/* 전체 모델 제거 버튼 */}
      <button
        onClick={clearAllModels}
        style={{
          background: "#f44336",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "3px",
          cursor: "pointer",
          fontSize: "12px",
          width: "100%",
        }}
      >
        모든 가구 제거
      </button>
    </div>
  );
}
