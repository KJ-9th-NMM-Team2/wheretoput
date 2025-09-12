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

                        onClick={onClose}
                        className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={onDelete}
                        className="px-4 py-2 cursor-pointer text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                    >
                        삭제
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 cursor-pointer text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"

                    >
                        저장
                    </button>
                    
                </>
            )}

            <button
                onClick={handleOutofRoomClick}

                className="px-4 cursor-pointer py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"

            >
                홈으로 돌아가기
            </button>
        </div>
    </>
}