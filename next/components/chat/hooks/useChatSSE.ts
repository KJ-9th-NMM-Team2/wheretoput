// 채팅 SSE 연결 관리 훅
// 폴링 방식을 대체하여 실시간으로 채팅방 업데이트를 수신

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ChatListItem, ChatSSEMessage } from '../types/chat-types';

interface UseChatSSEOptions {
  enabled: boolean;
  onRoomUpdate?: (roomId: string, updates: Partial<ChatListItem>) => void;
  onNewMessage?: (roomId: string, message: any) => void;
  onReadUpdate?: (roomId: string, userId: string, readAt: string) => void;
}

export const useChatSSE = ({ 
  enabled, 
  onRoomUpdate, 
  onNewMessage, 
  onReadUpdate 
}: UseChatSSEOptions) => {
  const { data: session } = useSession();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled || !session?.user?.id) return;
    
    // 기존 연결이 있으면 정리
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    
    const eventSource = new EventSource('/api/chat/sse');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      reconnectAttempts.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data: ChatSSEMessage = JSON.parse(event.data);

        switch (data.type) {
          case 'connected':
            break;

          case 'room_update':
            if (data.roomId && onRoomUpdate) {
              const updates: Partial<ChatListItem> = {
                lastMessage: data.message,
                lastMessageAt: data.lastMessageAt,
                lastMessageSenderId: data.lastMessageSenderId,
                searchIndex: (data.message ?? "").toLowerCase()
              };
              onRoomUpdate(data.roomId, updates);
            }
            break;

          case 'new_message':
            if (data.roomId && onNewMessage) {
              const messageData = {
                roomId: data.roomId,
                senderId: data.userId,
                senderName: data.senderName,
                senderImage: data.senderImage,
                content: data.message,
                message_type: data.messageType,
                createdAt: data.timestamp
              };
              onNewMessage(data.roomId, messageData);
            }
            break;

          case 'read_update':
            if (data.roomId && data.userId && data.timestamp && onReadUpdate) {
              onReadUpdate(data.roomId, data.userId, data.timestamp);
            }
            break;

          case 'keep-alive':
            break;
        }
      } catch (error) {
        console.error('SSE message parsing error:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      
      // 자동 재연결 시도
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      }
    };

  }, [enabled, session?.user?.id, onRoomUpdate, onNewMessage, onReadUpdate]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    reconnectAttempts.current = 0;
  }, []);

  // SSE 연결/해제 관리
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return disconnect;
  }, [enabled, connect, disconnect]);

  // 페이지 언로드 시 연결 정리
  useEffect(() => {
    const handleBeforeUnload = () => {
      disconnect();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [disconnect]);

  return {
    isConnected: eventSourceRef.current?.readyState === 1, // EventSource.OPEN = 1
    reconnect: connect,
    disconnect
  };
};