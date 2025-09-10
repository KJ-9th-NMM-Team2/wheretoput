import React, { useEffect, useRef, useState } from "react";
import { useStore } from "@/components/sim/useStore";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getColab } from "@/lib/api/toggleColab";


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

  const { data: session, status } = useSession();

  const {
    scaleValue,
    setScaleValue,
    addModel,
    clearAllModels,
    saveSimulatorState,
    cloneSimulatorState,
    isSaving,
    isCloning,
    currentRoomId,
    lastSavedAt,
    loadedModels,
    setShouldCapture,
    wallScaleFactor,
    setWallScaleFactor,
    loadSimulatorState,
    checkUserRoom,
    isOwnUserRoom,
    collaborationMode,
    checkCollabMode,
    isCollabModeActive,
    setAchievements,
  } = useStore();

  useEffect(() => {
    const useCheckUserRoom = async () => {
      if (status === "loading") return;
      if (!currentRoomId || !session?.user?.id) return;

      await checkUserRoom(currentRoomId, session?.user?.id);
    };
    useCheckUserRoom();
  }, [isOwnUserRoom, currentRoomId]);

  // 방의 협업 모드 상태 확인
  useEffect(() => {
    if (currentRoomId) {
      checkCollabMode(currentRoomId);
    }
  }, [currentRoomId, checkCollabMode]);

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

  // 방 복제하기
  const handleClone = async () => {
    try {
      const result = await cloneSimulatorState();
      console.log(result);
      const cloned_room_id = result.room_id;
      // 해당 링크로 이동

      window.location.href = `${cloned_room_id}`;
    } catch (error) {
      console.log("복제에 실패했습니다...");
    }
  };

  return (
    <div
      className={`
      bg-black bg-opacity-70 p-4 rounded text-white text-xs w-[250px]
      ${isPopup ? "static" : "absolute top-2.5 right-2.5 z-[100]"}
    `}
    >
      {/* 벽 스케일 설정 */}
      <div className="mb-2.5">
        <label className="text-white">벽 크기 조정:</label>
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
          className="w-full my-1.5"
        />
        <div className="text-orange-500 text-center">
          {wallScaleFactor.toFixed(1)}x
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="mb-2.5">
        <button
          onClick={handleSave}
          disabled={
            !isOwnUserRoom ||
            !currentRoomId ||
            (isCollabModeActive && !collaborationMode)
          }
          className={`
            w-full px-4 py-2.5 text-white border-none rounded text-sm mb-1.5
            ${
              currentRoomId
                ? isSaving
                  ? "bg-gray-500 cursor-not-allowed"
                  : isCollabModeActive && !collaborationMode
                  ? "bg-gray-500 cursor-not-allowed"
                  : isOwnUserRoom
                  ? "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                  : "bg-gray-500 cursor-not-allowed"
                : "bg-gray-600 cursor-not-allowed"
            }
          `}
          title={
            isCollabModeActive && !collaborationMode
              ? "협업 모드에서 저장해주세요."
              : ""
          }
        >
          {isSaving
            ? "저장 중..."
            : isCollabModeActive && !collaborationMode
            ? "협업 모드에서 저장해주세요."
            : isOwnUserRoom
            ? `방 상태 저장 (${loadedModels.length}개)`
            : `복제 후 저장해주세요.`}
        </button>

        {/* 저장 상태 메시지 */}
        {saveMessage && (
          <div
            className={`
            text-sm text-center mb-1.5
            ${saveMessage.includes("실패") ? "text-red-400" : "text-green-500"}
          `}
          >
            {saveMessage}
          </div>
        )}

        {/* 마지막 저장 시간 */}
        {isOwnUserRoom && lastSavedAt && (
          <div className="text-xs text-gray-400 text-center mb-1.5">
            마지막 저장: {lastSavedAt.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* 복제 버튼 */}
      <div className="mb-2.5">
        <button
          onClick={handleClone}
          disabled={!currentRoomId}
          className={`
            w-full px-4 py-2.5 text-white border-none rounded text-sm mb-1.5
            ${
              currentRoomId
                ? isCloning
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 cursor-pointer"
                : "bg-gray-600 cursor-not-allowed"
            }
          `}
        >
          {isCloning ? "복제 중..." : `방 복제하기`}
        </button>
      </div>

      {/* 전체 모델 제거 버튼 */}
      <button
        onClick={clearAllModels}
        className="w-full px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white border-none rounded text-sm cursor-pointer"
      >
        모든 가구 제거
      </button>
    </div>
  );
}
