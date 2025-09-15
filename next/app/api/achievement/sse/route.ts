import { addSSEConnection, removeSSEConnection } from "@/lib/api/achievement/utils/sse";
import { NextRequest } from "next/server";

/**
 * @swagger
 * /api/achievement/sse:
 *   get:
 *     tags:
 *       - SSE
 *     summary: 업적을 위한 SSE 연결을 위한 초기 엔드포인트
 *     description: 업적을 위한 클라이언트-서버 간 Server-Sent Events (SSE) 연결을 설정합니다. `userId` 쿼리 파라미터가 필요하며, 연결 성공 시 초기 `connected` 메시지를 반환합니다.
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: 업적을 위한 SSE 연결을 위한 사용자 ID
 *     responses:
 *       '200':
 *         description: 업적을 위한 SSE 연결 성공
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: |
 *                 data: {"type":"connected","message":"SSE 연결 성공","timeStamp":"2023-10-27T10:00:00.000Z"}
 *       '400':
 *         description: 유효하지 않은 요청
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: 'userId required'
 */
export async function GET(req: NextRequest) {
    console.log("🔫 GET 요청 받음");
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
        console.log("🔫 userId 없음 - 400 에러 반환");
        return new Response('userId required', { status: 400 });
    }

    const stream = new ReadableStream({
        start(controller) {
            // SSE 연결 저장 (controller를 저장)
            addSSEConnection(userId, controller);

            const connectMessage = `data: ${JSON.stringify({
                type: 'connected',
                message: 'SSE 연결 성공',
                timeStamp: new Date().toISOString()
            })}\n\n`;

            controller.enqueue(new TextEncoder().encode(connectMessage));
            console.log("🔫 초기 연결 메시지 전송됨");

            // 연결 종료 시 정리
            req.signal.addEventListener('abort', () => {
                console.log("🔫 SSE 연결 abort 이벤트");
                removeSSEConnection(userId);
                controller.close();
            });
        },
    });

    console.log("🔫 Response 반환 준비");

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}