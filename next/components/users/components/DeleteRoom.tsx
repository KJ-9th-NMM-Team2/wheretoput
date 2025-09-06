interface DeleteRoomProps {
    house: any;
    isOwner: boolean;
    isDeleteMode: boolean;
    selectedRooms: Set<string>;
    handleRoomSelect: (roomId: string) => void;
    setEditingRoom: (room: any) => void;
}

export function DeleteRoom({
    house,
    isOwner,
    isDeleteMode,
    selectedRooms,
    handleRoomSelect,
    setEditingRoom,
}: DeleteRoomProps) {

    const handleEditRoom = (room: any) => {
        setEditingRoom(room);
    };

    return (
        <>
            {isOwner && (
                <>
                    {isDeleteMode ? (
                        <div className="absolute top-2 left-2">
                            <input
                                type="checkbox"
                                checked={selectedRooms.has(house.room_id)}
                                onChange={() => handleRoomSelect(house.room_id)}
                                className="w-5 h-5 text-red-600 bg-white border-2 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                            />
                        </div>
                    ) : (
                        <button
                            onClick={() => handleEditRoom(house)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            <svg
                                className="w-4 h-4 text-gray-600 dark:text-gray-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                        </button>
                    )}
                </>
            )}
        </>
    );
}