import { prisma } from "@/lib/prisma";

export const getFurniture = async (room_id: string) => {
    return prisma.room_objects.findMany({
        where: {
            room_id
        }
    });
}