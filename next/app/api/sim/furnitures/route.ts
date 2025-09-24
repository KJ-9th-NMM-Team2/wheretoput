/**
 * @swagger
 * /api/sim/furnitures:
 *   get:
 *     tags:
 *       - sim (시뮬레이터)
 *     summary: 가구 목록 조회 (페이지네이션)
 *     description: 카테고리별 가구 목록을 페이지네이션으로 조회합니다
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: 한 페이지당 아이템 수
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *         description: 카테고리 ID
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, updated_desc]
 *           default: updated_desc
 *         description: 정렬 기준 (price_asc=가격오름차순, price_desc=가격내림차순, updated_desc=최신순)
 *     responses:
 *       200:
 *         description: 가구 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *                 debug:
 *                   type: object
 *       500:
 *         description: 서버 오류
 */
import { prisma } from "@/lib/prisma";
import type { furnitures as Furniture } from "@prisma/client";
import { calculatePagination } from "@/lib/paginagtion";
import { searchFurnitures } from "@/lib/api/furniture/furSearch";
import { HttpResponse } from "@/utils/httpResponse";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "8");
    const categoryParam = searchParams.get("category");
    const category = categoryParam ? parseInt(categoryParam) : null;
    const sortParam = searchParams.get("sort") || "created_desc";
    const query = searchParams.get("query") || "";
    const skip = (page - 1) * limit;

    // 정렬 옵션 설정
    let orderBy: any = { updated_at: "desc" }; 
    // 기본값: 최신순 (DB에 가구 업데이트 날짜)
    switch (sortParam) {
      case "price_asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      case "created_desc":
      default:
        orderBy = { created_at: "desc" };
        break;
    }

    console.log(`Fetching page ${page}, limit ${limit}, category: ${category}`);

    // 변수를 try 블록 밖에서 선언
    let furnitures: Furniture[] = [];
    let totalCount: number = 0;

    try {
      if (categoryParam && Number(category) < 99) {
        // 카테고리가 지정된 경우
        [furnitures, totalCount] = await Promise.all([
          prisma.furnitures.findMany({
            where: {
              category_id: category,
            },
            take: limit,
            skip: skip,
            orderBy: orderBy,
          }),
          prisma.furnitures.count({
            where: {
              category_id: category,
            },
          }),
        ]);
      } else {
        if (query) {
          const result = await searchFurnitures(query, categoryParam || "99", page, limit);
          console.log(result);
          return result;
        } else {
          // 카테고리 지정 안된 경우 - 전체 가구
          [furnitures, totalCount] = await Promise.all([
            prisma.furnitures.findMany({
              take: limit,
              skip: skip,
              orderBy: orderBy,
            }),
            prisma.furnitures.count(),
          ]);
        }
      }

      console.log(
        `조회 성공: ${furnitures.length}개 조회, 전체 ${totalCount}개`
      );
    } catch (dbError) {
      console.error("데이터베이스 쿼리 실패:", dbError);
      throw dbError; // 상위로 에러 전파
    }

    // 응답 데이터 구성
    const response = {
      items: furnitures,
      pagination: calculatePagination(page, limit, totalCount),
      debug: {
        searchParams: searchParams.toString(),
        appliedCategory: category,
        skip,
        limit,
        resultCount: furnitures.length,
      },
    };

    return Response.json(response);
  } catch (error) {
    console.error("API Error:", error);
    const details = process.env.NODE_ENV === "development"
      ? error.stack
      : "Server error occurred";
    return HttpResponse.internalError(error.message, details);
  }
}
