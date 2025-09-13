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
                    onClick={handleOutofRoomClick}
                    className="tool-btn-gray"
                >
                    홈으로 돌아가기
                </button>
            )}
        </div>
    </>
}