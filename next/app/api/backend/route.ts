// 수정 필요
/**
 * @swagger
 * /api/chat/token:
 *   get:
 *     tags:
 *       - chat token
 *     summary: 토큰 교환 + 소켓 준비
 *     description: 토큰 교환 + 소켓 준비
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

import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        console.log("유저 목록 불러오기 111111");
        const searchParams = new URL(req.url).searchParams;
        const query = searchParams.get('q') || '';
        const limit = parseInt(searchParams.get('limit') || "10");
        console.log("유저 목록 불러오기 2222222");
        const users = await prisma.user.findMany({
            where: {
                name: {
                    contains: query,
                    mode: "insensitive",
                }
            },
            take: limit,
        })

        console.log("유저 목록 불러오기 33333333");
        console.log("유저 목록 보기", users);

        if (!users) {
            return Response.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 })
        }
        return Response.json(users);
    } catch (error) {
        console.error("Error backend route.ts :", error);
    return new Response("Internal Server Error", { status: 500 });
    }
}