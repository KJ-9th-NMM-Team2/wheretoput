import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { furnitures as Furniture } from "@prisma/client";

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
    const searchParams = new URL(req.url).searchParams;
    const idsParams = searchParams.get('idsParams');
    const sortParam = searchParams.get('sort') || 'updated_desc';

    if (!idsParams) {
        return Response.json([]);
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

    const [furnitures, priceSum] = await Promise.all([
        prisma.furnitures.findMany({
            where: { furniture_id: { in: furnitureIds } },
            orderBy: orderBy
        }),
        prisma.furnitures.aggregate({
            where: { furniture_id: { in: furnitureIds } },
            _sum: { price: true }
        })
    ]);

    return Response.json({
        furnitures: furnitures,
        totalPrice: priceSum,
        count: (await furnitures).length
    })
    
}