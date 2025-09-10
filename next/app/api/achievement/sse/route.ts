import { addSSEConnection, removeSSEConnection } from "@/lib/api/achievement/utils/sse";
import { NextRequest } from "next/server";

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