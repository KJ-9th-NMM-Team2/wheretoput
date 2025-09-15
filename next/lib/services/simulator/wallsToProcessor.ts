import { room_walls as Wall } from "@prisma/client";

export const wallsToProcessor = async (wallsToProcess: Wall[]) => {
    return wallsToProcess.map((wall) => ({
        id: `wall-${wall.wall_id}`,
        wall_id: wall.wall_id,
        start: { x: Number(wall.start_x), y: Number(wall.start_y) },
        end: { x: Number(wall.end_x), y: Number(wall.end_y) },
        length: Number(wall.length),
        height: Number(wall.height),
        depth: Number(wall.depth),
        position: [
            Number(wall.position_x),
            Number(wall.position_y),
            Number(wall.position_z),
        ],
        rotation: [
            Number(wall.rotation_x),
            Number(wall.rotation_y),
            Number(wall.rotation_z),
        ],
        wall_order: wall.wall_order,
    }));
}