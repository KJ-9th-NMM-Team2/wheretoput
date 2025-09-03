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

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const roomId = req.nextUrl.searchParams.get('roomId');
        const userId = req.nextUrl.searchParams.get('userId');
        const content = req.nextUrl.searchParams.get('content');

        const NEST_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        
        const nestResponse = await fetch(`${NEST_API_URL}/chat/message`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: req.headers.get('authorization') || "",
            },
            body: JSON.stringify({
                roomId,
                userId,
                content
            })
        });

        if (!nestResponse.ok) {
            const errorText = await nestResponse.text();
            return Response.json(
                { error: "Nestjs Error", details: errorText},
                { status: nestResponse.status }
            )
        }

        const result = await nestResponse.json();
        return Response.json(result, {status: 200});
    } catch (error) {
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}