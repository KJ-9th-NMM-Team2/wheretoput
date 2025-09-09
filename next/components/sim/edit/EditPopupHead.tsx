import { X } from "lucide-react";

interface EditPopupHeadProps {
    onClose: () => void;
}

export const EditPopupHead = ({onClose} : EditPopupHeadProps) => {
    return <>
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">방 정보 수정</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>
    </>

}