import { NextRequest, NextResponse } from 'next/server';
import { sendToRoomParticipants, broadcastToChatUsers, debugChatConnections } from '../route';
import { ChatSSEMessage } from '@/components/chat/types/chat-types';

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
    return NextResponse.json({ error: 'Failed to process SSE notification' }, { status: 500 });
  }
}