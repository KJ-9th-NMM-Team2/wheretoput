// 게임 스타일 채팅 UI - sim/collaboration 페이지 전용
// 페이지 하단에 입력창, 그 위에 투명한 채팅 기록 표시
"use client"

import { forwardRef, useRef, useEffect, useState, useCallback } from "react";
import { MdImage, MdClose, MdDragIndicator, MdLock } from "react-icons/md";
import { Message } from "../types/chat-types";

interface GameStyleChatPopupProps {
  isVisible: boolean;
  messages: Message[];
  text: string;
  setText: (text: string) => void;
  onSendMessage: (content: string, messageType?: "text" | "image") => void;
  currentUserId: string | null;
  onChatFocus?: (isFocused: boolean) => void;
}

const GameStyleChatPopup = forwardRef<HTMLDivElement, GameStyleChatPopupProps>(
  (
    {
      isVisible,
      messages,
      text,
      setText,
      onSendMessage,
      currentUserId,
      onChatFocus,
    },
    ref
  ) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sendButtonRef = useRef<HTMLButtonElement>(null);
    const [selectedImage, setSelectedImage] = useState<{
      file: File;
      preview: string;
    } | null>(null);
    const [position, setPosition] = useState(() => ({
      x: typeof window !== 'undefined' ? window.innerWidth - 420 : 0,
      y: typeof window !== 'undefined' ? window.innerHeight - 560 : 0
    }));
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isDragEnabled, setIsDragEnabled] = useState(true);

    // 새 메시지가 추가될 때마다 스크롤을 맨 아래로 (부드럽게)
    useEffect(() => {
      if (messages.length > 0) {
        // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 스크롤
        const timer = setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
          });
        }, 10);

        return () => clearTimeout(timer);
      }
    }, [messages.length]); // messages 배열 전체가 아닌 length만 의존

    // 메시지 전송 함수
    const sendWithImage = async () => {
      try {
        // 1. 이미지가 있으면 별도 메시지로 전송
        if (selectedImage) {
          console.log('이미지 전송 시작:', selectedImage.file);

          // FormData 생성
          const formData = new FormData();
          formData.append('image', selectedImage.file);

          // TODO: 실제 이미지 업로드 API 호출
          const response = await fetch('/api/chat/upload-image', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const { imageUrl } = await response.json();

            // 이미지 메시지 전송 
            console.log('이미지 업로드 완료, S3 Key:', imageUrl);
            onSendMessage(imageUrl, "image");

            // 2. 이미지 전송후 메시지 보내기
            if (text.trim()) {
              onSendMessage(text.trim(), "text");
              setText('');
            }

          } else {
            console.error('이미지 업로드 실패');
          }

          // 전송 후 정리
          removeSelectedImage();
        } else {
          // 3. 이미지가 없으면 텍스트만 전송
          if (text.trim()) {
            onSendMessage(text.trim(), "text");
            setText('');
          }
        }
      } catch (error) {
        console.error('메시지 전송 오류:', error);
      }
    };

    // 키보드 이벤트 핸들러
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendWithImage();
      }
    };
    const handleImageClick = () => {
      fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // URL.createObjectURL로 미리보기 생성
        const imageUrl = URL.createObjectURL(file);
        setSelectedImage({
          file,
          preview: imageUrl
        });

        // input 값 초기화 (같은 파일을 다시 선택할 수 있도록)
        e.target.value = '';

        // 이미지 선택 후 전송 버튼으로 포커스 이동
        setTimeout(() => {
          sendButtonRef.current?.focus();
        }, 100);
      }
    };

    const removeSelectedImage = () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage.preview);
        setSelectedImage(null);
      }
    };
    const getShouldShowTime = (message: Message, array: Message[], index: number) => {
      // 현재 메시지의 시간
      const currentTime = new Date(message.createdAt).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      // 다음 메시지의 시간 (있다면)
      const nextMessage = array[index + 1];
      const nextTime = nextMessage ? new Date(nextMessage.createdAt).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }) : null;

      return !nextMessage || currentTime !== nextTime;
    }

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      // 드래그 비활성화 상태이거나 입력창, 버튼, 스크롤바 클릭은 드래그 방지
      const target = e.target as HTMLElement;
      if (!isDragEnabled || target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button') || target.closest('input')) {
        return;
      }

      setIsDragging(true);
      // 현재 위치 기준으로 offset 계산
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }, [position, isDragEnabled]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const maxX = window.innerWidth - 400;
      const maxY = window.innerHeight - 300;

      setPosition({
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY))
      });
    }, [isDragging, dragOffset]);

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);

    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = 'none';

        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.body.style.userSelect = '';
        };
      }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        className="fixed z-[10] pointer-events-none flex flex-col justify-end"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '400px',
          height: '500px'
        }}
      >
        {/* 채팅 메시지 영역 - 고정 높이와 스크롤 */}
        <div className="flex-1 flex flex-col justify-end overflow-hidden">
          <div
            className="bg-gray-400/30 w-full rounded-lg pointer-events-auto relative"
            style={{
              cursor: isDragEnabled ? (isDragging ? 'grabbing' : 'move') : 'default'
            }}
            onMouseDown={handleMouseDown}
          >
            <div
              className="h-70 overflow-y-auto p-4 pb-2 flex flex-col select-none"
              style={{ scrollBehavior: 'smooth', zIndex: 999 }}
              onWheel={(e) => e.stopPropagation()}
            >
              {/* 드래그 토글 버튼 */}
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={() => setIsDragEnabled(!isDragEnabled)}
                  className={`p-1 rounded-full transition-all duration-200 ${
                    isDragEnabled
                      ? 'bg-blue-500/20 text-blue-600 hover:bg-blue-500/30'
                      : 'bg-gray-500/20 text-gray-600 hover:bg-gray-500/30'
                  }`}
                  title={isDragEnabled ? '드래그 비활성화' : '드래그 활성화'}
                >
                  {isDragEnabled ? <MdDragIndicator size={16} /> : <MdLock size={16} />}
                </button>
              </div>
              <div className="flex-1"></div> {/* 스페이서 - 메시지를 하단으로 밀어줌 */}
              <div className="flex flex-col space-y-2 transition-all duration-200 ease-out">
                {messages.map((message, index, array) => {
                  const shouldShowTime = getShouldShowTime(message, array, index);
                  return (
                    <div
                      key={message.id}
                      style={{
                        transform: "translateY(0)",
                      }}
                    >
                      <div className={`flex flex-col ${message.senderId === currentUserId
                        ? "items-end"
                        : "items-start"
                        }`}>
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg shadow-sm backdrop-blur-sm border transition-all duration-200 ${message.senderId === currentUserId
                            ? "bg-gradient-to-r from-blue-400/80 to-cyan-400/80 text-white border-blue-400/50"
                            : "bg-white/90 text-black border-gray-300/50"
                            }`}
                        >
                          {message.senderId !== currentUserId && (
                            <div className="text-xs font-medium mb-1 opacity-70">
                              {message.senderName}
                            </div>
                          )}
                          <div className="text-xs break-words">
                            {(message.message_type === "image" || message.content.startsWith("chat/")) ? (
                              <img
                                src={`/api/chat/image/${encodeURIComponent(message.content)}`}
                                alt="이미지"
                                className="max-w-full max-h-48 rounded-lg cursor-pointer"
                                onError={(e) => {
                                  // 이미지 로드 실패 시 S3 키 텍스트로 표시
                                  const errorDiv = document.createElement('div');
                                  errorDiv.textContent = `이미지 로드 실패: ${message.content}`;
                                  errorDiv.className = 'text-red-400 text-xs';
                                  e.currentTarget.parentNode?.replaceChild(errorDiv, e.currentTarget);
                                }}
                              />
                            ) : (
                              message.content
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-600">
                          <span>
                            {shouldShowTime && new Date(message.createdAt).toLocaleTimeString("ko-KR", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        </div>

        {/* 입력창 영역 - 페이지 하단 고정, 더 컴팩트하게 */}
        <div className="pointer-events-auto p-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {/* 이미지 미리보기 */}
          {selectedImage && (
            <div className="mb-2 p-2 border border-gray-200 rounded-lg bg-gray-50/90 backdrop-blur-sm max-w-md mx-auto">
              <div className="flex items-center gap-2">
                <img
                  src={selectedImage.preview}
                  alt="미리보기"
                  className="w-12 h-12 object-cover rounded border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-gray-700">{selectedImage.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedImage.file.size / 1024 / 1024).toFixed(1)}MB
                  </p>
                </div>
                <button
                  onClick={removeSelectedImage}
                  className="p-1 rounded-full hover:bg-gray-200 cursor-pointer transition-transform hover:scale-110"
                >
                  <MdClose size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 max-w-md mx-auto">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => onChatFocus?.(true)}
              onBlur={() => onChatFocus?.(false)}
              placeholder="메시지 입력..."
              className="flex-1 px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm placeholder-gray-500 text-black h-9"
            />
            {/* 이미지 버튼 */}
            <button
              onClick={handleImageClick}
              className="px-2 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 cursor-pointer transition-transform hover:scale-110"
            >
              <MdImage size={20} />
            </button>
            <button
              ref={sendButtonRef}
              onClick={sendWithImage}
              disabled={!text.trim() && !selectedImage}
              className="px-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors min-w-[48px] flex items-center justify-center h-9"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }
);

GameStyleChatPopup.displayName = "GameStyleChatPopup";

export default GameStyleChatPopup;
