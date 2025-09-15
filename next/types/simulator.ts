import { Prisma } from "@prisma/client";

export type SimulatorObject = {
    id: string;
    object_id: string;
    furniture_id: string;
    name: string;
    position: number[];
    rotation: number[];
    length: number[];
    scale: number[];
    url: string;
    isCityKit: boolean;
    texturePath: null;
    type: string;
    furnitureName: string;
    categoryId: number | null;
};

export type SimualtorWall = {
    id: string;
    wall_id: string;
    start: { x: number, y: number };
    end: { x: number, y: number };
    length: number;
    height: number;
    depth: number;
    position: number[];
    rotation: number[];
    wall_order: number | null;
};

export type SimualtorModel = {
    success: boolean,
    room_id: string,
    objects: SimulatorObject[],
    walls: SimualtorWall[],
    loaded_count: number,
    walls_count: number,
    room_info: {
        title: string | null,
        description: string | null,
        is_public: boolean | null,
        updated_at: Date | null,
    },
    wall_color: string,
    floor_color: string,
    background_color: string,
    environment_preset: string,
}

export type RoomObjectTransformer = Prisma.room_objectsGetPayload<{
    include: {
        furnitures: {
            select: {
                furniture_id: true;
                name: true;
                model_url: true;
                category_id: true;
                length_x: true;
                length_y: true;
                length_z: true;
                cached_model_url: true;
            }
        }
    }
}>;

export type RoomForLoadSim = Prisma.roomsGetPayload<{
    select: {
        title: true,
        description: true,
        is_public: true,
        updated_at: true,
        wall_color: true,
        floor_color: true,
        background_color: true,
        environment_preset: true,
    }
}>