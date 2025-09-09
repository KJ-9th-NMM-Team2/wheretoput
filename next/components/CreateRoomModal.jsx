import React from "react";

const CreateRoomModal = ({ isOpen, onClose, onConfirm, roomCount }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            방 생성 완료!
          </h2>
          <p className="text-gray-600"></p>
        </div>

        <div className="flex gap-3 ">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            도면으로 돌아가기
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
          >
            시뮬레이터로 이동
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;
