import type { furnitures as Furniture } from '@prisma/client';

export const createNewModel = (
    item: Furniture, 
    modelUrl?: string
) => ({
    furniture_id: item.furniture_id,
    url: modelUrl || item.model_url,
    name: item.name,
    length_x: item.length_x,
    length_y: item.length_y,
    length_z: item.length_z,
    price: item.price,
    brand: item.brand,
    isCityKit: false,
    texturePath: null,
    position: [0, 0, 0] as [number, number, number]
});