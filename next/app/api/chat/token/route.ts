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

import { getToken } from "next-auth/jwt";

// 토큰이 유효한지 체크하는 API
export async function GET(req: Request) {
    const token = await getToken({ 
        req: req,
        secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
        return Response.json({ error: "No token" }, { status: 401 });
    }
    
    console.log("token", token);
    return Response.json({ 
        tokenData: token,
        userId: token.id 
    });
}