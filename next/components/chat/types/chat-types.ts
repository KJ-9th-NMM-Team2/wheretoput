// 채팅 관련 타입 정의들
// ChatButton.tsx에서 분리된 타입들

export type ChatListItem = {
  chat_room_id: string;
  name: string; // UI 표시용 (룸 이름)
  is_private: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageAt?: string;
  last_read_at: string;
  searchIndex: string; //  검색 전용: 마지막 메시지 전용
};

export type Message = {
  id: string;
  roomId: string;
  senderId: string;
  senderName?: string;
  senderImage?: string;
  content: string;
  createdAt: string;
  status?: "sending" | "sent" | "read";
  tempId?: string;
};

export type UserLite = {
  id: string;
  name: string;
  image?: string;
};