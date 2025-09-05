// 공통 메시지 버블 컴포넌트
// 채팅방에서 메시지를 표시하는 버블

import { Message } from "../../types/chat-types";

interface MessageBubbleProps {
  message: Message;
  showAvatar: boolean;
  showTimestamp: boolean;
  currentUserId: string | null;
}

export default function MessageBubble({ 
  message, 
  showAvatar, 
  showTimestamp, 
  currentUserId 
}: MessageBubbleProps) {
  const isMine = String(message.senderId) === String(currentUserId);

  return (
    <div
      className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
    >
      {!isMine && (
        <div
          className={`h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 ${
            showAvatar ? "opacity-100" : "opacity-0"
          }`}
        >
          {message.senderImage ? (
            <img
              src={message.senderImage}
              alt={message.senderName ?? "avatar"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : null}
        </div>
      )}

      <div
        className={`max-w-[75%] ${
          isMine ? "items-end" : "items-start"
        } flex flex-col`}
      >
        {!isMine && showAvatar && message.senderName ? (
          <span className="text-[11px] text-gray-400 pl-1 mb-0.5">
            {message.senderName}
          </span>
        ) : null}

        <div
          className={[
            "px-3 py-2 rounded-2xl whitespace-pre-wrap break-words",
            isMine
              ? "bg-orange-500 text-white rounded-br-sm"
              : "bg-gray-100 text-gray-900 rounded-bl-sm",
          ].join(" ")}
        >
          {message.content}
        </div>

        {showTimestamp && (
          <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
            <span>
              {new Date(message.createdAt).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
            {isMine && message.status === "sending" && <span>전송 중</span>}
            {isMine && message.status === "sent" && <span>보냄</span>}
            {isMine && message.status === "read" && <span>읽음</span>}
          </div>
        )}
      </div>

      {isMine && <div className="h-8 w-8 flex-shrink-0" />}
    </div>
  );
}