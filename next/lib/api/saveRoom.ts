interface SaveRoomProps {
    setSaveMessage: (message: string) => void;
    saveSimulatorState: () => Promise<void>;
    currentRoomId: string | null;
    loadedModels: any[];
    setShouldCapture: (value: boolean) => void;
}

export const saveRoom = async ({
    setSaveMessage,
    saveSimulatorState,
    currentRoomId,
    loadedModels,
    setShouldCapture
}: SaveRoomProps) => {

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