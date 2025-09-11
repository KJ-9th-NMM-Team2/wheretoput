import { searchFurnitures } from '@/lib/api/furSearch';

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
    const selectedCategory = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || "1");
    const limit = parseInt(searchParams.get('limit') || "8");
    const response = await searchFurnitures(query, selectedCategory, page, limit);
    
    // Response 객체에서 JSON 데이터 추출
    const results = await response.json();
    return Response.json(results);
}
