import { RoomForLoadSim, SimulatorObject, SimualtorWall, SimualtorModel } from "@/types/simulator";

export const extractRoomInfo = async (room: RoomForLoadSim, objects: SimulatorObject[], walls: SimualtorWall[], room_id: string) => {
    const wall_color = room.wall_color || "#ffffff";
    const floor_color = room.floor_color || "#d2b48c";
    const background_color = room.background_color || "#87ceeb";
    const environment_preset = room.environment_preset || "apartment";
    const wall_type = room.wall_type || "color";
    const floor_type = room.floor_type || "color";
    const result: SimualtorModel = {
        success: true,
        room_id: room_id,
        objects: objects,
        walls: walls,
        loaded_count: objects.length,
        walls_count: walls.length,
        room_info: {
            title: room.title,
            description: room.description,
            is_public: room.is_public,
            updated_at: room.updated_at,
        },
        wall_color: wall_color,
        floor_color: floor_color,
        background_color: background_color,
        environment_preset: environment_preset,
        wall_type: wall_type,
        floor_type: floor_type,
    }

    return result;
}