import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /api/sim/search:
 *   get:
 *     tags:
 *       - sim (시뮬레이터)
 *     summary: 가구 검색
 *     description: 가구 이름 또는 브랜드명으로 검색
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색할 가구 이름 또는 브랜드명
 *     responses:
 *       200:
 *         description: 검색된 가구 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
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
