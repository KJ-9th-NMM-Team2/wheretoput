import React, { useState } from "react";
import { EditPopupHead } from "../edit/EditPopupHead";
import { EditPopupFields } from "../edit/EditPopupFields";
import { EditPopupButtons } from "../edit/EditPopupButtons";

interface EditPopupProps {
  initialTitle: string;
  initialDescription: string;
  initialIsPublic: boolean;
  isOwnUserRoom: boolean;
  onSave: (title: string, description: string, isPublic: boolean) => void;
  onDelete: () => void;
  onClose: () => void;
  handleOutofRoomClick: () => void;
  showHomeButton?: boolean;
}

// initialTitle - 초기 집 이름 값
// initialDescription - 초기 집 설명 값
// initialIsPublic - 초기 공개 여부 값

// 집 정보 수정 UI
const EditPopup: React.FC<EditPopupProps> = ({
  initialTitle,
  initialDescription,
  initialIsPublic,
  isOwnUserRoom,
  onSave,
  onDelete,
  onClose,
  handleOutofRoomClick,
  showHomeButton = true,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(initialIsPublic);

  const handleSave = () => {
    onSave(title, description, isPublic);
  };

  
  return <>
    <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-40">
      <div
        className="bg-white rounded-lg p-6 min-w-80 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <EditPopupHead onClose={onClose}/>

        {/* 폼 필드들 */}
        <EditPopupFields 
          title={title} 
          description={description} 
          isPublic={isPublic} 
          setTitle={setTitle} 
          setDescription={setDescription} 
          setIsPublic={setIsPublic}
          isOwnUserRoom={isOwnUserRoom}
        />

        {/* 버튼들 */}
        <EditPopupButtons
          onClose={onClose}
          onDelete={onDelete}
          handleSave={handleSave}
          handleOutofRoomClick={handleOutofRoomClick}
          isOwnUserRoom={isOwnUserRoom}
          showHomeButton={showHomeButton}
        />
      </div>
    </div>
  </>
};

export default EditPopup;
