import { prisma } from '@/lib/prisma';
import type { Furnitures } from '@prisma/client'

export async function searchFurnitures(query: string) {
    try {
        const decodeString = decodeURIComponent(query);

        if (!decodeString.trimStart() && !decodeString.trimEnd()) {
            return [];
        }
        
        const furnitures = await prisma.furnitures.findMany({
            where: {
                OR: [
                    {name: {contains: decodeString, mode: 'insensitive'}},
                    {brand: {contains: decodeString, mode: 'insensitive'}},
                ]
            },
            distinct: ['furniture_id'], // 중복 제거
            orderBy: [{updated_at: 'desc'}],
        });
        console.error("Get Search Furnitures successfully");
        return Response.json(furnitures);
    } catch (error) {
        console.error("Error Search Furnitures:", error);
        return new Response("Internal Server Error", { status: 500})
    }
    
}