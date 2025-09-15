import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// 타입 정의 (중앙 집중화된 타입 사용)
import { ChatSSEMessage } from '@/components/chat/types/chat-types';
import { HttpResponse } from "@/utils/httpResponse";

// 채팅 SSE 연결 관리 (userId별로 여러 연결 허용)
// Hot Reload 대응을 위해 global 객체 사용
declare global {
  var __chatConnections: Map<string, ReadableStreamDefaultController[]> | undefined;
}

if (!global.__chatConnections) {
  global.__chatConnections = new Map<string, ReadableStreamDefaultController[]>();
}

const chatConnections = global.__chatConnections;

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    // SSE 스트림 생성
    const stream = new ReadableStream({
      start(controller) {
        // 연결 저장 (배열로 관리)
        if (!chatConnections.has(userId)) {
          chatConnections.set(userId, []);
        }
        chatConnections.get(userId)!.push(controller);

        const totalConnections = Array.from(chatConnections.values()).reduce((sum, arr) => sum + arr.length, 0);
      
        // 초기 연결 확인 메시지
        const encoder = new TextEncoder();
        const welcomeMessage = `data: ${JSON.stringify({
          type: 'connected',
          userId,
          timestamp: new Date().toISOString()
        })}\n\n`;
        controller.enqueue(encoder.encode(welcomeMessage));


        // 주기적인 keep-alive (30초마다)
        const keepAliveInterval = setInterval(() => {
          try {
            const keepAlive = `data: ${JSON.stringify({
              type: 'keep-alive',
              timestamp: new Date().toISOString()
            })}\n\n`;
            controller.enqueue(encoder.encode(keepAlive));
          } catch (error) {
            clearInterval(keepAliveInterval);
            // 해당 controller만 제거
            const userConnections = chatConnections.get(userId);
            if (userConnections) {
              const index = userConnections.indexOf(controller);
              if (index > -1) {
                userConnections.splice(index, 1);
                if (userConnections.length === 0) {
                  chatConnections.delete(userId);
                }
              }
            }
          }
        }, 30000);

        // 연결 종료 시 정리
        request.signal.addEventListener('abort', () => {
          clearInterval(keepAliveInterval);
          // 해당 controller만 제거
          const userConnections = chatConnections.get(userId);
          if (userConnections) {
            const index = userConnections.indexOf(controller);
            if (index > -1) {
              userConnections.splice(index, 1);
              if (userConnections.length === 0) {
                chatConnections.delete(userId);
              }
            }
          }
        });
      },

      cancel() {
        // cancel 시에는 해당 사용자의 모든 연결을 정리
        const userConnections = chatConnections.get(userId);
        if (userConnections) {
          chatConnections.delete(userId);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Nginx 버퍼링 비활성화
      },
    });

  } catch (error) {
    return HttpResponse.internalError();
  }
}

// 특정 사용자에게 메시지 전송
export function sendToChatUser(userId: string, data: ChatSSEMessage) {
  const controllers = chatConnections.get(userId);
  if (controllers && controllers.length > 0) {
    for (let i = controllers.length - 1; i >= 0; i--) {
      const controller = controllers[i];
      try {
        const encoder = new TextEncoder();
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      } catch (error) {
        // 실패한 연결만 제거
        controllers.splice(i, 1);
        if (controllers.length === 0) {
          chatConnections.delete(userId);
        }
      }
    }
  }
}

// 모든 연결된 사용자에게 브로드캐스트
export function broadcastToChatUsers(data: ChatSSEMessage) {
  const totalConnections = Array.from(chatConnections.values()).reduce((sum, arr) => sum + arr.length, 0);

  for (const [userId, controllers] of chatConnections) {
    for (let i = controllers.length - 1; i >= 0; i--) {
      const controller = controllers[i];
      try {
        const encoder = new TextEncoder();
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      } catch (error) {
        // 실패한 연결만 제거
        controllers.splice(i, 1);
        if (controllers.length === 0) {
          chatConnections.delete(userId);
        }
      }
    }
  }
}

// 특정 채팅방 참가자들에게만 전송
export async function sendToRoomParticipants(roomId: string, data: ChatSSEMessage, excludeUserId?: string) {

  // 실제 구현에서는 채팅방 참가자 목록을 DB에서 조회해야 함
  // 여기서는 모든 연결된 사용자에게 전송하고 클라이언트에서 필터링
  for (const [userId, controller] of chatConnections) {
    if (excludeUserId && userId === excludeUserId) continue;

    try {
      const encoder = new TextEncoder();
      const message = `data: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(encoder.encode(message));
    } catch (error) {
      chatConnections.delete(userId);
    }
  }
}

// 연결된 사용자 수 조회
export function getChatConnectionCount(): number {
  return chatConnections.size;
}

// 디버깅용: 현재 연결 상태 출력
export function debugChatConnections() {
  const totalConnections = Array.from(chatConnections.values()).reduce((sum, arr) => sum + arr.length, 0);
  return {
    totalUsers: chatConnections.size,
    totalConnections,
    userConnections: Array.from(chatConnections.entries()).map(([userId, controllers]) => ({
      userId,
      connectionCount: controllers.length
    }))
  };
}