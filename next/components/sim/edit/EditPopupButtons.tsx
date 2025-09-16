import { useStore } from '@/components/sim/useStore';

interface EditPopupButtonsProps {
    onClose: () => void;
    onDelete: () => void;
    handleSave: () => void;
    handleOutofRoomClick: () => void;
    isOwnUserRoom: boolean;
    showHomeButton?: boolean;
}

export const EditPopupButtons = ({
    onClose, onDelete, handleSave, handleOutofRoomClick, isOwnUserRoom, showHomeButton = true
}: EditPopupButtonsProps) => {
    const saveSimulatorState = useStore((state) => state.saveSimulatorState);
    const isSaving = useStore((state) => state.isSaving);

    const handleHomeWithAutoSave = async () => {
        // 자신의 방이고 저장 중이 아닐 때만 자동저장
        if (isOwnUserRoom && !isSaving) {
            try {
                await saveSimulatorState();
                console.log('홈으로 돌아가기 전 자동저장 완료');
            } catch (error) {
                console.error('자동저장 실패:', error);
            }
        }

        // 저장 후 홈으로 이동
        handleOutofRoomClick();
    };

    return <>
        {/* 버튼들 */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            {isOwnUserRoom && (
                <>
                    <button
                        onClick={handleSave}
                        className="tool-btn tool-btn-active"
                    >
                        저장
                    </button>
                    
                </>
            )}

            {showHomeButton && (
                <button
                    onClick={handleHomeWithAutoSave}
                    className="tool-btn-gray"
                    disabled={isSaving}
                >
                    {isSaving ? '저장 중...' : '홈으로 돌아가기'}
                </button>
            )}
        </div>
    </>
}