interface EditPopupFieldsProps {
    title: string;
    description: string;
    isPublic: boolean;
    setTitle: (title: string) => void;
    setDescription: (description: string) => void;
    setIsPublic: (isPublic: boolean) => void;
    isOwnUserRoom: boolean;
}

export const EditPopupFields = ({
    title, setTitle,
    description, setDescription,
    isPublic, setIsPublic,
    isOwnUserRoom
} : EditPopupFieldsProps) => {
    return <>
        {/* 폼 필드들 */}
        <div className="space-y-4">
            {/* 방 이름 */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    방 이름
                </label>
                <input
                    type="text"
                    value={title}
                    readOnly={!isOwnUserRoom}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      text-gray-500
                      "
                    placeholder="방 이름을 입력하세요"
                />
            </div>
            {/* 방 설명 */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    방 설명
                </label>
                <textarea
                    value={description}
                    readOnly={!isOwnUserRoom}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-500"
                    rows={3}
                    placeholder="방에 대한 설명을 입력하세요"
                />
            </div>


            {isOwnUserRoom && (
            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label
                    htmlFor="isPublic"
                    className="ml-2 text-sm font-medium text-gray-700"
                >
                    다른 사용자에게 공개
                </label>
            </div>
        )}
        </div>
    </>
}