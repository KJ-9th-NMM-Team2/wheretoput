import { prisma } from "@/lib/prisma"

export const checkUserOwnRoom = async (room_id: string, user_id: string) => {
    return await prisma.rooms.findUnique ({
        where: {
            room_id,
            user_id
        }
    })
}