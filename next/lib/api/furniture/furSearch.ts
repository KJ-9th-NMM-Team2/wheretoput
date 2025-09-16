import { prisma } from '@/lib/prisma';
import { calculatePagination } from '@/lib/paginagtion';

export async function searchFurnitures(query: string, selectedCategory: string, page: number, limit: number) {
    try {
        const decodeString = decodeURIComponent(query);

        if (!decodeString.trimStart() && !decodeString.trimEnd()) {
            return [];
        }

        // 카테고리 ID 검증
        const categoryId = parseInt(selectedCategory);
        if (isNaN(categoryId)) {
            throw new Error('유효하지 않은 카테고리 ID입니다');
        }
        
        const whereCondition = {
            AND: [{
                OR: [
                    { name: { contains: decodeString, mode: 'insensitive' } },
                    { brand: { contains: decodeString, mode: 'insensitive' } }
                ]
            }]
        }

        const skip = (page - 1) * limit;

        console.log("limit, check in searchfurnitures", limit);
        console.log("skip, , check in searchfurnitures", skip);
        console.log("query, , check in searchfurnitures", query);

        if (categoryId !== 99) {
            whereCondition.AND.push({ category_id: categoryId });
        }

        // 1단계: 고유한 furniture_id만 페이징해서 가져오기
        const uniqueIds = await prisma.furnitures.findMany({
            where: whereCondition,
            select: { furniture_id: true },
            distinct: ['furniture_id'],
            skip: skip,
            take: limit,
        });

        const totalCount = await prisma.furnitures.count({
            where: whereCondition,
        })

        // 2단계: 해당 ID들의 최신 데이터 가져오기
        const furnitures = await prisma.furnitures.findMany({
            where: {
                ...whereCondition,
                furniture_id: { in: uniqueIds.map(f => f.furniture_id) }
            },
            orderBy: [{ updated_at: 'desc' }]
        });

        const response = {
            items: furnitures,
            pagination: calculatePagination(page, limit, totalCount),
            debug: {
                skip,
                limit,
                resultCount: furnitures.length,
            },
        };
        return Response.json(response);
    } catch (error) {
        console.error("Error Search Furnitures:", error);
        return new Response("Internal Server Error", { status: 500})
    }
    
}