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
import { prisma } from "@/lib/prisma";
import jwt from 'jsonwebtoken'; 

// 토큰이 유효한지 체크하는 API
export async function GET(req: Request) {
    const token = await getToken({ 
        req: req,
        secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
        return Response.json({ error: "No token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: {
            id: token.id as string
        }
    })

    if (user) {
        const newToken = jwt.sign(
            {id: token.id},
            process.env.NEXTAUTH_SECRET || "your-super-secret-jwt-key-here",
            {expiresIn: '1h'},
        )
        return Response.json({
            token: newToken,
            userId: token.id
        })
    }
    
    return Response.json("Not find correct user with token id", {status:400});
}