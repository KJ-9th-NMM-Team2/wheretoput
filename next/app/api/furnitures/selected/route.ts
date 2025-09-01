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

    if (!idsParams) {
        return Response.json([]);
    }
    const furnitureIds = idsParams.split(',');

    const [furnitures, priceSum] = await Promise.all([
        prisma.furnitures.findMany({
            where: { furniture_id: { in: furnitureIds } }
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