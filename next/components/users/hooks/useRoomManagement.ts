import { useState } from "react";
import { updateRoomInfo, deleteRoom } from "@/lib/services/roomService";

interface UseRoomManagementProps {
  userRooms: any[];
  setUserRooms: (updater: (prev: any[]) => any[]) => void;
}

export const useRoomManagement = ({ userRooms, setUserRooms }: UseRoomManagementProps) => {
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());

  const handleSaveRoom = async (
    title: string,
    description: string,
    isPublic: boolean
  ) => {
    if (!editingRoom) return;

    const success = await updateRoomInfo(editingRoom.room_id, {
      title,
      description,
      is_public: isPublic,
    });

    if (success) {
      // 방 목록 업데이트
      setUserRooms((prev) =>
        prev.map((room) =>
          room.room_id === editingRoom.room_id
            ? { ...room, title, description, is_public: isPublic }
            : room
        )
      );
      setEditingRoom(null);
    }
  };

  const handleDeleteRoom = async () => {
    if (!editingRoom) return;

    if (!confirm("정말로 이 방을 삭제할까요?")) {
      return;
    }

    const success = await deleteRoom(editingRoom.room_id);
    if (success) {
      // 방 목록에서 제거
      setUserRooms((prev) =>
        prev.filter((room) => room.room_id !== editingRoom.room_id)
      );
      setEditingRoom(null);
      alert("방이 성공적으로 삭제되었습니다.");
    } else {
      alert("방 삭제에 실패했습니다.");
    }
  };

  const handleToggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedRooms(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedRooms.size === 0) return;

    const deletedRooms = new Set<string>();
    for (const roomId of selectedRooms) {
      const success = await deleteRoom(roomId);
      if (success) {
        deletedRooms.add(roomId);
      }
    }

    if (deletedRooms.size > 0) {
      // 성공적으로 삭제된 방들을 목록에서 제거
      setUserRooms((prev) =>
        prev.filter((room) => !deletedRooms.has(room.room_id))
      );
      setSelectedRooms(new Set());
      setIsDeleteMode(false);

      // 사용자에게 결과 알림
      if (deletedRooms.size === selectedRooms.size) {
        alert(`${deletedRooms.size}개의 방이 성공적으로 삭제되었습니다.`);
      } else {
        alert(
          `${deletedRooms.size}개의 방이 삭제되었습니다. (${
            selectedRooms.size - deletedRooms.size
          }개 실패)`
        );
      }
    } else {
      alert("방 삭제에 실패했습니다.");
    }
  };

  return {
    editingRoom,
    setEditingRoom,
    isDeleteMode,
    selectedRooms,
    setSelectedRooms,
    handleSaveRoom,
    handleDeleteRoom,
    handleToggleDeleteMode,
    handleBulkDelete
  };
};