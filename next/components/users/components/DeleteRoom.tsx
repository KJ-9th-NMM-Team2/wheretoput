interface DeleteRoomProps {
    house: any;
    isOwner: boolean;
    isDeleteMode: boolean;
    selectedRooms: Set<string>;
    handleRoomSelect: (roomId: string) => void;
}

export function DeleteRoom({
    house,
    isOwner,
    isDeleteMode,
    selectedRooms,
    handleRoomSelect,
}: DeleteRoomProps) {

    return (
        <>
            {isOwner && (
                <>
                    {isDeleteMode && (
                        <div className="absolute top-2 left-2">
                            <input
                                type="checkbox"
                                checked={selectedRooms.has(house.room_id)}
                                onChange={() => handleRoomSelect(house.room_id)}
                                className="w-5 h-5 text-red-600 bg-white border-2 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                            />
                        </div>
                    )}
                </>
            )}
        </>
    );
}