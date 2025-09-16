import { prisma } from "@/lib/prisma";
import { HttpResponse } from "@/utils/httpResponse";

/**
 * @swagger
 * /api/sim/categories:
 *   get:
 *     tags:
 *       - sim (시뮬레이터)
 *     summary: 카테고리 목록 조회
 *     description: 특정 ID에 해당하는 카테고리 목록을 조회합니다
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 카테고리 ID
 *     responses:
 *       200:
 *         description: 카테고리 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: 서버 오류
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const id = parseInt(searchParams.get("id") || "1");

    const whereCondition: any = {
      category_id: id,
    };

    const categories = await prisma.categories.findMany({
      where: {
        where: whereCondition,
        // is_active가 true인 카테고리만 (필요한 경우)
        // is_active: true
      },
      orderBy: {
        name: "asc",
      },
    });

    return Response.json({
      categories,
    });
  } catch (error) {
    console.error("Categories API Error:", error);
    return HttpResponse.internalError("Failed to fetch categories");
  }
}
