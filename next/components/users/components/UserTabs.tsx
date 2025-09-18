"use client";
import { useState, useMemo } from "react";
import { HomeCard } from "@/components/main/HomeCardList";
import AchievementList from "./AchievementList";
import { DeleteRoom } from "./DeleteRoom";
import { FaTrashCan } from "react-icons/fa6";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { PaginationControls } from "@/components/ui/Pagination";

interface UserTabsProps {
  user: any;
  userRooms: any[];
  isOwner: boolean;
  isDeleteMode: boolean;
  selectedRooms: Set<string>;
  handleToggleDeleteMode: () => void;
  handleBulkDelete: () => void;
  setSelectedRooms: React.Dispatch<React.SetStateAction<Set<string>>>;
  setEditingRoom: (room: any) => void;
}

export default function UserTabs({
  user,
  userRooms,
  isOwner,
  isDeleteMode,
  selectedRooms,
  handleToggleDeleteMode,
  handleBulkDelete,
  setSelectedRooms,
  setEditingRoom,
}: UserTabsProps) {
  const [isAchievement, setIsAchievement] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const handleRoomSelect = (roomId: string) => {
    setSelectedRooms((prev: Set<string>) => {
      const newSelected = new Set(prev);
      if (newSelected.has(roomId)) {
        newSelected.delete(roomId);
      } else {
        newSelected.add(roomId);
      }
      return newSelected;
    });
  };

  const handleConfirmBulkDelete = () => {
    handleBulkDelete();
    setShowBulkDeleteModal(false);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const { paginatedRooms, totalPages, totalRooms } = useMemo(() => {
    const total = userRooms.length;
    const pages = Math.ceil(total / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const items = userRooms.slice(startIndex, startIndex + itemsPerPage);

    return {
      paginatedRooms: items,
      totalPages: pages,
      totalRooms: total,
    };
  }, [userRooms, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setIsAchievement(false)}
            className={`
              text-md font-medium leading-normal px-3 py-2 rounded-2xl
              ${!isAchievement ? "tool-btn" : "tool-btn-gray"}
            `}
          >
            {user.display_name || user.name} 님의 방
          </button>

          <button
            onClick={() => setIsAchievement(true)}
            className={`
              text-md font-medium leading-normal px-3 py-2 rounded-2xl
              ${isAchievement ? "tool-btn" : "tool-btn-gray"}
            `}
          >
            나의 업적
          </button>
        </div>

        {isOwner && paginatedRooms.length > 0 && !isAchievement && (
          <div className="flex items-center gap-3">
            {isDeleteMode && (
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                disabled={selectedRooms.size === 0}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedRooms.size === 0
                    ? "tool-btn-gray !cursor-not-allowed"
                    : "tool-btn-red text-red-700"
                }`}
              >
                선택한 방 삭제 ({selectedRooms.size})
              </button>
            )}
            <button
              onClick={handleToggleDeleteMode}
              className={`tool-btn-red px-4 py-3 ${
                isDeleteMode
                  ? "bg-gray-600 text-white hover:bg-gray-700"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              {isDeleteMode ? "취소" : <FaTrashCan size={24} />}
            </button>
          </div>
        )}
      </div>

      {isAchievement ? (
        <AchievementList />
      ) : paginatedRooms.length > 0 ? (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-2 sm:px-4 justify-items-stretch sm:justify-items-center">
            {paginatedRooms.map((house: any) => (
              <div key={house.room_id} className="relative group">
                <HomeCard
                  room={house}
                  isDeleteMode={isDeleteMode}
                  onThumbnailClick={() => handleRoomSelect(house.room_id)}
                />
                <DeleteRoom
                  house={house}
                  isOwner={isOwner}
                  isDeleteMode={isDeleteMode}
                  selectedRooms={selectedRooms}
                  handleRoomSelect={handleRoomSelect}
                />
              </div>
            ))}
          </div>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          ></PaginationControls>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            아직 공개된 방이 없습니다.
          </p>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={showBulkDeleteModal}
        title="선택한 방들을 삭제하시겠습니까?"
        message={`${selectedRooms.size}개의 방이 영구적으로 삭제됩니다.`}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
      />
    </>
  );
}
