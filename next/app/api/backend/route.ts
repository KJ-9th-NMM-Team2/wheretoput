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
        const searchParams = new URL(req.url).searchParams;
        const query = searchParams.get('q') || '';
        const limit = parseInt(searchParams.get('limit') || "10");

        const users = await prisma.user.findMany({
            where: {
                name: {
                    contains: query,
                    mode: "insensitive",
                }
            },
            take: limit,
        })

        if (!users) {
            return Response.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 })
        }
        return Response.json(users);
    } catch (error) {
        console.log("Server /api/backend ERROR");
        return Response.json("Server Error Occurred...", {status: 400});
    }
}