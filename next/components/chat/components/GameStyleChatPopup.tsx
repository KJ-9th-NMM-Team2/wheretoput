// 게임 스타일 채팅 UI - sim/collaboration 페이지 전용
// 페이지 하단에 입력창, 그 위에 투명한 채팅 기록 표시

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

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        className="fixed inset-0 z-[999] pointer-events-none flex flex-col justify-end"
      >
        {/* 채팅 메시지 영역 - 투명 배경 */}
        <div className="flex-1 flex flex-col justify-end overflow-hidden">
          <div className="ml-auto w-100 max-w-[calc(100vw-20px)] p-4 pb-2">
            <div className="flex flex-col space-y-2 transition-all duration-200 ease-out">
              {messages.slice(-8).map(
                (
                  message // 최근 8개 메시지만 표시
                ) => (
                  <div
                    key={message.id}
                    className={`flex animate-fade-in ${
                      message.senderId === currentUserId
                        ? "justify-end"
                        : "justify-start"
                    }`}
                    style={{
                      opacity: 1,
                      transform: "translateY(0)",
                      transition:
                        "opacity 0.3s ease-out, transform 0.3s ease-out",
                    }}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg shadow-sm backdrop-blur-sm border transition-all duration-200 ${
                        message.senderId === currentUserId
                          ? "bg-blue-500/80 text-white border-blue-400/50"
                          : "bg-white/90 text-black border-gray-300/50"
                      }`}
                    >
                      {message.senderId !== currentUserId && (
                        <div className="text-xs font-medium mb-1 opacity-70">
                          {message.senderName}
                        </div>
                      )}
                      <div className="text-sm">{message.content}</div>
                    </div>
                  </div>
                )
              )}
              <div ref={messagesEndRef} />
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
