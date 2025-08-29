import { prisma } from "@/lib/prisma";

// GET 요청을 받았을 때
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const decodeString = decodeURIComponent(query);

    if (!decodeString.trim()) {
        return Response.json([]);
    }
    
    const furnitures = await prisma.furnitures.findMany({
        where: {
            OR: [
                {name: {
                    contains: decodeString, // 어디든 포함 (LIKE %query%)
                    mode: 'insensitive', // 대소문자 구분 안함
                }},
                {brand: {
                    contains: decodeString,
                    mode: 'insensitive',
                }}
            ]
        },
        distinct: ['furniture_id'], // furniture_id 기준으로 중복 제거
        orderBy: [
            { name: 'asc' }
        ],
    });


    console.log("furniture 결과:", furnitures);
    return Response.json(furnitures);
}
