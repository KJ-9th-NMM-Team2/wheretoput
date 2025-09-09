// 게임 스타일 채팅 UI - sim/collaboration 페이지 전용
// 페이지 하단에 입력창, 그 위에 투명한 채팅 기록 표시
"use client"

import { forwardRef, useRef, useEffect } from "react";
import { Message } from "../types/chat-types";

interface GameStyleChatPopupProps {
  isVisible: boolean;
  messages: Message[];
  text: string;
  setText: (text: string) => void;
  onSendMessage: (content: string) => void;
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
    const handleSendMessage = () => {
      if (text.trim()) {
        onSendMessage(text.trim());
        setText("");
      }
    };

    // 키보드 이벤트 핸들러
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
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

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        className="fixed inset-0 z-[999] pointer-events-none flex flex-col justify-end"
      >
        {/* 채팅 메시지 영역 - 고정 높이와 스크롤 */}
        <div className="flex-1 flex flex-col justify-end overflow-hidden">
          <div className="ml-auto bg-gray-400/30 w-100 max-w-[calc(100vw-20px)] rounded-lg">
            <div
              className="h-70 overflow-y-auto p-4 pb-2 flex flex-col pointer-events-auto select-none"
              style={{ scrollBehavior: 'smooth' }}
              onWheel={(e) => e.stopPropagation()}
            >
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
                            ? "bg-orange-500/80 text-white border-blue-400/50"
                            : "bg-white/90 text-black border-gray-300/50"
                            }`}
                        >
                          {message.senderId !== currentUserId && (
                            <div className="text-xs font-medium mb-1 opacity-70">
                              {message.senderName}
                            </div>
                          )}
                          <div className="text-xs break-words">{message.content}</div>
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
          <div className="flex items-center space-x-2 max-w-md mx-auto">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              onFocus={() => onChatFocus?.(true)}
              onBlur={() => onChatFocus?.(false)}
              placeholder="메시지 입력..."
              className="flex-1 px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm placeholder-gray-500 text-black h-9"
            />
            <button
              onClick={handleSendMessage}
              disabled={!text.trim()}
              className="px-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors min-w-[48px] flex items-center justify-center h-9"
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
