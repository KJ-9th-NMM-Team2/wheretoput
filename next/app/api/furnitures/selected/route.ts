import { prisma } from "@/lib/prisma";
import { HttpResponse } from "@/utils/httpResponse";
import { NextRequest } from "next/server";

/**
 * @swagger
 * /api/furnitures/selected:
 *   get:
 *     tags:
 *       - furnitures
 *     summary: Get selected furnitures
 *     description: Retrieve a list of selected furnitures
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
export async function GET(req: NextRequest) {
    try {
        const searchParams = new URL(req.url).searchParams;
        const idsParams = searchParams.get('idsParams');
        const roomId = searchParams.get('roomId');
        const sortParam = searchParams.get('sort') || 'updated_desc';

        if (!idsParams) {
            return HttpResponse.badRequest();
        }
        const furnitureIds = idsParams.split(',');

        // 정렬 옵션 설정
        let orderBy: any = { updated_at: "desc" }; // 기본값: 최신순 (DB에 가구 업데이트 날짜)
        switch (sortParam) {
            case "price_asc":
                orderBy = { price: "asc" };
                break;
            case "price_desc":
                orderBy = { price: "desc" };
                break;
            case "updated_desc":
            default:
                orderBy = { updated_at: "desc" };
                break;
        }

        const [furnitures, mergedCounts] = await Promise.all([
            prisma.furnitures.findMany({
                where: { furniture_id: { in: furnitureIds } },
                orderBy: orderBy
            }),
            prisma.room_objects.groupBy({
                by: ['furniture_id'],
                where: { room_id: roomId || "" },
                _count: { furniture_id: true },
            }),
        ]);

        // count Map 생성
        const countMap = mergedCounts.reduce<Record<string, number>>((acc, item) => {
            acc[item.furniture_id] = item._count.furniture_id;
            return acc;
        }, {});

        // furnitures에 count 정보 추가
        const furnituresWithCount = furnitures.map(furniture => ({
            ...furniture,
            count: countMap[furniture.furniture_id] || 0
        }));


        // 실제 총액 = 각 가구의 (가격 × 개수)의 합
        const actualTotalPrice = furnituresWithCount.reduce((sum, furniture) =>
            sum + (furniture.price * furniture.count), 0
        );


        return Response.json({
            furnitures: furnituresWithCount,
            totalPrice: actualTotalPrice,
            count: (await furnitures).length,
        })
    } catch (error) {
        return HttpResponse.internalError();
    }
}