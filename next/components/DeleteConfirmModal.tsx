"use client";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

const DeleteConfirmModal = ({ isOpen, onConfirm, onCancel, title, message }: DeleteConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-white/10 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {title || "정말 삭제하시겠습니까?"}
        </h3>
        {message && (
          <p className="text-gray-600 mb-4 text-sm">
            {message}
          </p>
        )}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="tool-btn-gray"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="tool-btn-red"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;