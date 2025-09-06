"use client";
import { useState } from "react";
import HouseCard from "@/components/search/HouseCard";
import AchievementList from "./AchievementList";
import { DeleteRoom } from "./DeleteRoom";
import { FaTrashCan } from "react-icons/fa6";

interface UserTabsProps {
  user: any;
  userRooms: any[];
  isOwner: boolean;
  isDeleteMode: boolean;
  selectedRooms: Set<string>;
  handleToggleDeleteMode: () => void;
  handleBulkDelete: () => void;
  setSelectedRooms: (rooms: Set<string>) => void;
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

  const handleRoomSelect = (roomId: string) => {
    setSelectedRooms((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(roomId)) {
        newSelected.delete(roomId);
      } else {
        newSelected.add(roomId);
      }
      return newSelected;
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setIsAchievement(false)}
            className={`
              text-md font-medium leading-normal px-3 py-2 rounded-md transition-all duration-200
              hover:scale-105 active:scale-95
              ${!isAchievement 
                ? 'bg-amber-100 text-amber-800 dark:bg-orange-600 dark:text-white' 
                : 'text-gray-700 hover:text-amber-800 hover:bg-amber-50 dark:text-gray-200 dark:hover:text-white dark:hover:bg-gray-700'
              }
            `}
          >
            {user.display_name || user.name}의 방들
          </button>

          <button
            onClick={() => setIsAchievement(true)}
            className={`
              text-md font-medium leading-normal px-3 py-2 rounded-md transition-all duration-200
              hover:scale-105 active:scale-95
              ${isAchievement 
                ? 'bg-amber-100 text-amber-800 dark:bg-orange-600 dark:text-white' 
                : 'text-gray-700 hover:text-amber-800 hover:bg-amber-50 dark:text-gray-200 dark:hover:text-white dark:hover:bg-gray-700'
              }
            `}
          >
            나의 업적
          </button>
        </div>

        {isOwner && userRooms.length > 0 && !isAchievement && (
          <div className="flex items-center gap-3">
            {isDeleteMode && (
              <button
                onClick={handleBulkDelete}
                disabled={selectedRooms.size === 0}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedRooms.size === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-300 text-red-700 hover:bg-red-400"
                }`}
              >
                선택한 방 삭제 ({selectedRooms.size})
              </button>
            )}
            <button
              onClick={handleToggleDeleteMode}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isDeleteMode
                  ? "bg-gray-600 text-white hover:bg-gray-700"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              {isDeleteMode ? "취소" : <FaTrashCan size={20} />}
            </button>
          </div>
        )}
      </div>

      {isAchievement ? (
        <AchievementList />
      ) : (
        userRooms.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-7 p-4">
            {userRooms.map((house: any) => (
              <div key={house.room_id} className="relative group">
                <HouseCard
                  house={house}
                  isDeleteMode={isDeleteMode}
                  onThumbnailClick={() => handleRoomSelect(house.room_id)}
                />
                <DeleteRoom 
                  house={house}
                  isOwner={isOwner}
                  isDeleteMode={isDeleteMode} 
                  selectedRooms={selectedRooms}
                  handleRoomSelect={handleRoomSelect}
                  setEditingRoom={setEditingRoom}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              아직 공개된 방이 없습니다.
            </p>
          </div>
        )
      )}
    </>
  );
}