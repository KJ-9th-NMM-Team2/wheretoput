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
        const currentUserId = req.nextUrl.searchParams.get("currentUserId");
        const otherUserId = req.nextUrl.searchParams.get("otherUserId");

        if (!currentUserId || !otherUserId) {
            return Response.json(
                { error: "Missing currentUserId or otherUserId" },
                { status: 400 }
            );
        }

        // NestJS 서버 주소 (환경 변수로 관리하는 게 좋음)
        const NEST_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

        console.log('NEXT currentUserId: ', currentUserId);
        const nestResponse = await fetch(`${NEST_API_URL}/rooms/direct`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // 프론트에서 받은 Authorization 헤더를 그대로 NestJS로 넘김
                Authorization: req.headers.get("authorization") || "",
            },
            body: JSON.stringify({
                otherUserId: otherUserId,   // NestJS는 다른 유저 아이디만 필요
                currentUserId: currentUserId, // 필요하면 같이 넘겨도 됨
            }),
        });

        console.log("nestResponse", nestResponse);

        if (!nestResponse.ok) {
            const errorText = await nestResponse.text();
            return Response.json(
                { error: "NestJS error", details: errorText },
                { status: nestResponse.status }
            );
        }

        // NestJS에서 응답 받은 JSON 그대로 반환
        const result = await nestResponse.json();
        return Response.json(result, { status: 200 });
    } catch (error) {
        return Response.json("api/backend/rooms/direct Serrver Error", { status: 400 });
    }
}
