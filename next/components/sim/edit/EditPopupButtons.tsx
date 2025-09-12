interface EditPopupButtonsProps {
    onClose: () => void;
    onDelete: () => void;
    handleSave: () => void;
    handleOutofRoomClick: () => void;
    isOwnUserRoom: boolean;
}

export const EditPopupButtons = ({
    onClose, onDelete, handleSave, handleOutofRoomClick, isOwnUserRoom
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

            <button
                onClick={handleOutofRoomClick}
                className="tool-btn tool-btn-inactive"
            >
                홈으로 돌아가기
            </button>
        </div>
    </>
}