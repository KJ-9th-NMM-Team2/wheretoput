// 공통 메시지 버블 컴포넌트
// 채팅방에서 메시지를 표시하는 버블

import { Message } from "../../types/chat-types";
import { useState, useEffect } from "react";
import ImageModal from "./ImageModal";

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
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageLoading, setImageLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // 이미지 메시지인 경우 S3 presigned URL 가져오기
  useEffect(() => {
    if (message.message_type === "image" && message.content) {
      setImageLoading(true);
      
      // S3 키를 presigned URL로 변환
      fetch('/api/upload-url/getFileUrl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ s3Key: message.content })
      })
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          setImageUrl(data.url);
        }
      })
      .catch(err => {
        console.error('이미지 URL 가져오기 실패:', err);
      })
      .finally(() => {
        setImageLoading(false);
      });
    }
  }, [message.content, message.message_type]);

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
            message.message_type === "image" ? "p-1" : "px-3 py-2",
            "rounded-2xl whitespace-pre-wrap break-words",
            isMine
              ? "bg-orange-500 text-white rounded-br-sm"
              : "bg-gray-100 text-gray-900 rounded-bl-sm",
          ].join(" ")}
        >
          {message.message_type === "image" ? (
            <div className="max-w-[200px]">
              {imageLoading ? (
                <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-sm">로딩 중...</span>
                </div>
              ) : imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt="채팅 이미지"
                  className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setModalOpen(true)}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-sm">이미지 로드 실패</span>
                </div>
              )}
            </div>
          ) : (
            message.content
          )}
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
      
      {/* 이미지 모달 */}
      {message.message_type === "image" && (
        <ImageModal 
          isOpen={modalOpen}
          imageUrl={imageUrl}
          s3Key={message.content} // S3 키 전달
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}