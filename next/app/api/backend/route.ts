/**
 * @swagger
 * /api/backend:
 *   get:
 *     tags:
 *       - User
 *     summary: 사용자 검색
 *     description: 이름을 기준으로 사용자를 검색합니다.
 *     parameters:
 *       - name: q
 *         in: query
 *         required: false
 *         description: 검색할 사용자 이름(부분 일치 검색, 대소문자 무시)
 *         schema:
 *           type: string
 *           example: "john"
 *       - name: limit
 *         in: query
 *         required: false
 *         description: 검색 결과 제한 개수 (기본값 10)
 *         schema:
 *           type: integer
 *           example: 5
 *     responses:
 *       200:
 *         description: 사용자 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "clx123abc456"
 *                   name:
 *                     type: string
 *                     example: "John Doe"
 *                   email:
 *                     type: string
 *                     example: "john@example.com"
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 내부 오류
 */

import { prisma } from "@/lib/prisma";
import { HttpResponse } from "@/utils/httpResponse";

export async function GET(req: Request) {
    try {
        const searchParams = new URL(req.url).searchParams;
        const query = searchParams.get('q') || '';
        const limit = parseInt(searchParams.get('limit') || "10");
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    {
                        name: {
                            contains: query,
                            mode: "insensitive",
                        }
                    },
                    {
                        display_name: {
                            contains: query,
                            mode: "insensitive",
                        }
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                display_name: true,
                email: true,
                image: true,
            },
            take: limit,
        })

        if (!users) {
            return HttpResponse.notFound("사용자를 찾을 수 없습니다.");
        }
        return Response.json(users);
    } catch (error) {
        console.error("Error backend route.ts :", error);
        return HttpResponse.internalError();
    }
}