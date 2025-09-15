import { NextRequest, NextResponse } from 'next/server';
import { sendToRoomParticipants, broadcastToChatUsers, debugChatConnections } from '../route';
import { ChatSSEMessage } from '@/components/chat/types/chat-types';
import { HttpResponse } from '@/utils/httpResponse';

/**
 * @swagger
 * /api/chat/sse/notify:
 *   post:
 *     tags:
 *       - Chat
 *       - SSE
 *     summary: 채팅 관련 SSE 알림을 브로드캐스팅합니다.
 *     description: |
 *       채팅방의 새 메시지, 읽음 상태 업데이트 등 실시간 이벤트를 SSE를 통해 모든 연결된 클라이언트에게 전송합니다.
 *       요청 본문의 `type` 값에 따라 다른 종류의 알림을 브로드캐스팅합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required:
 *                   - type
 *                   - roomId
 *                   - message
 *                   - lastMessageAt
 *                   - lastMessageSenderId
 *                 properties:
 *                   type:
 *                     type: string
 *                     description: 알림 타입. 'room_update'
 *                     example: "room_update"
 *                   roomId:
 *                     type: string
 *                     description: 업데이트된 채팅방 ID
 *                     example: "chat-room-123"
 *                   message:
 *                     type: string
 *                     description: 최신 메시지 내용
 *                     example: "안녕하세요"
 *                   lastMessageAt:
 *                     type: string
 *                     format: date-time
 *                     description: 최신 메시지 전송 시간
 *                     example: "2023-10-27T10:00:00.000Z"
 *                   lastMessageSenderId:
 *                     type: string
 *                     description: 최신 메시지 발신자 ID
 *                     example: "user-abc"
 *                   messageType:
 *                     type: string
 *                     description: 메시지 타입 (e.g., text, image)
 *                     example: "text"
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     description: 이벤트 발생 시간
 *                     example: "2023-10-27T10:00:00.000Z"
 *                   userId:
 *                     type: string
 *                     description: 알림 발신자의 사용자 ID
 *                     example: "user-def"
 *                   senderName:
 *                     type: string
 *                     description: 알림 발신자의 이름
 *                     example: "김철수"
 *                   senderImage:
 *                     type: string
 *                     description: 알림 발신자의 프로필 이미지 URL
 *                     example: "https://example.com/profile.jpg"
 *               - type: object
 *                 required:
 *                   - type
 *                   - roomId
 *                   - userId
 *                 properties:
 *                   type:
 *                     type: string
 *                     description: 알림 타입. 'read_update'
 *                     example: "read_update"
 *                   roomId:
 *                     type: string
 *                     description: 업데이트된 채팅방 ID
 *                     example: "chat-room-456"
 *                   userId:
 *                     type: string
 *                     description: 읽음 상태를 업데이트한 사용자 ID
 *                     example: "user-abc"
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     description: 이벤트 발생 시간
 *                     example: "2023-10-27T10:05:00.000Z"
 *     responses:
 *       '200':
 *         description: 알림 브로드캐스팅 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       '500':
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to process SSE notification"
 */

export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as ChatSSEMessage & {
      userId: string;
      senderName: string;
      senderImage: string;
    };


    // SSE를 통해 모든 연결된 클라이언트에게 전송
    if (data.type === 'room_update') {
      // 채팅방 업데이트 알림
      broadcastToChatUsers({
        type: 'room_update',
        roomId: data.roomId,
        message: data.message,
        lastMessageAt: data.lastMessageAt,
        lastMessageSenderId: data.lastMessageSenderId,
        messageType: data.messageType,
        timestamp: data.timestamp
      });

      // 새 메시지 알림 (채팅 팝업이 닫혀있을 때 알림용)
      broadcastToChatUsers({
        type: 'new_message',
        roomId: data.roomId,
        userId: data.userId,
        senderName: data.senderName,
        senderImage: data.senderImage,
        message: data.message,
        messageType: data.messageType,
        timestamp: data.timestamp
      });

    } else if (data.type === 'read_update') {
      // 읽음 상태 업데이트 알림
      broadcastToChatUsers({
        type: 'read_update',
        roomId: data.roomId,
        userId: data.userId,
        timestamp: data.timestamp
      });

    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ SSE 알림 처리 실패:', error);
    return HttpResponse.internalError("Failed to process SSE notification");
  }
}