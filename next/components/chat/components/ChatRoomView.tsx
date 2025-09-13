// 채팅방 대화 화면 컴포넌트
// 개별 채팅방에서 메시지들을 보여주고 메시지를 입력할 수 있는 화면

import { forwardRef, useRef, useState } from "react";
import { MdImage, MdClose } from "react-icons/md";
import MessageBubble from "./shared/MessageBubble";
import { ChatListItem, Message } from "../types/chat-types";
import { shouldShowAvatar, shouldShowTimestamp } from "../utils/chat-utils";

interface ChatRoomViewProps {
  selectedChat: ChatListItem | null;
  groupedByDay: Record<string, Message[]>;
  text: string;
  setText: (text: string) => void;
  send: () => void;
  onSendMessage: (roomId: string, content: string, messageType?: "text" | "image") => void;
  onEditorKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onBack: () => void;
  currentUserId: string | null;
  onChatFocus?: (isFocused: boolean) => void;
}

const ChatRoomView = forwardRef<HTMLDivElement, ChatRoomViewProps>(
  ({
    selectedChat,
    groupedByDay,
    text,
    setText,
    send,
    onSendMessage,
    onEditorKeyDown,
    onBack,
    currentUserId,
    onChatFocus,
  }, listRef) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sendButtonRef = useRef<HTMLButtonElement>(null);
    const [selectedImage, setSelectedImage] = useState<{
      file: File;
      preview: string;
    } | null>(null);

    const handleImageClick = () => {
      fileInputRef.current?.click();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendWithImage();
      }
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

            if (selectedChat?.chat_room_id) {
              // 이미지 메시지는 content에 S3 키를 저장, 타입은 "image"
              onSendMessage(selectedChat.chat_room_id, imageUrl, "image");
            }

            // 2. 이미지 전송후 메시지 보내기
            if (text.trim()) {
              send();
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
            send();
            setText('');
          }
        }
      } catch (error) {
        console.error('메시지 전송 오류:', error);
      }
    };
    return (
      <div className="flex flex-col h-full">
        <header className="px-3 py-2 flex items-center justify-between text-xl">
          <div className="flex min-w-0 items-center gap-2">
            <b className="px-2 truncate">
              {selectedChat?.name || "새 대화"}
            </b>
          </div>
          <button
            onClick={onBack}
            className="
              text-md font-medium leading-normal px-3 py-2 rounded-2xl transition-all duration-300
              hover:scale-105 active:scale-95 shadow-md hover:shadow-lg cursor-pointer
              text-gray-700 hover:text-blue-700 hover:bg-white hover:border-blue-300 
              dark:text-gray-200 dark:hover:text-blue-300 dark:hover:bg-gray-700 
              border border-gray-200 dark:border-gray-600
            "
          >
            ←
          </button>
        </header>

        {/* 채팅내용 */}
        <div
          ref={listRef}
          className="flex-1 space-y-4 px-3 overflow-y-auto py-2"
        >
          {Object.entries(groupedByDay).map(([date, arr]) => (
            <div key={date} className="space-y-3">
              <div className="sticky top-0 z-10 flex justify-center">
                <span className="text-[11px] bg-white/80 backdrop-blur px-2 py-1 rounded-full border border-gray-200 text-gray-500">
                  {date}
                </span>
              </div>
              {arr.map((m, i) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  showAvatar={shouldShowAvatar(arr, i)}
                  showTimestamp={shouldShowTimestamp(arr, i)}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          ))}
        </div>

        {/* 푸터 */}
        <footer className="border-t border-gray-200 p-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {/* 이미지 미리보기 */}
          {selectedImage && (
            <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-start gap-3">
                <img
                  src={selectedImage.preview}
                  alt="미리보기"
                  className="w-20 h-20 object-cover rounded-lg border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedImage.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedImage.file.size / 1024 / 1024).toFixed(2)}MB
                  </p>
                </div>
                <button
                  onClick={removeSelectedImage}
                  className="p-1 rounded-full hover:bg-gray-200 cursor-pointer transition-transform hover:scale-110"
                >
                  <MdClose size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2 items-end">
            {/* 이미지 버튼 */}
            <button
              onClick={handleImageClick}
              className="
                text-md font-medium leading-normal px-3 py-2 rounded-2xl transition-all duration-300
                hover:scale-105 active:scale-95 shadow-md hover:shadow-lg cursor-pointer
                text-gray-700 hover:text-blue-700 hover:bg-white hover:border-blue-300 
                dark:text-gray-200 dark:hover:text-blue-300 dark:hover:bg-gray-700 
                border border-gray-200 dark:border-gray-600
              "
            >
              <MdImage size={20} />
            </button>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지 입력..."
              onFocus={() => onChatFocus?.(true)}
              onBlur={() => onChatFocus?.(false)}
              rows={1}
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300 max-h-40"
            />
            <button
              ref={sendButtonRef}
              onClick={sendWithImage}
              disabled={!text.trim() && !selectedImage}
              className={`
                text-md font-medium leading-normal px-3 py-2 rounded-2xl transition-all duration-300
                hover:scale-105 active:scale-95 shadow-md hover:shadow-lg
                ${text.trim() || selectedImage
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white cursor-pointer'
                  : 'text-gray-700 bg-gray-200 cursor-not-allowed border border-gray-200 dark:border-gray-600'
                }
              `}
            >
              전송
            </button>
          </div>
        </footer>
      </div>
    );
  }
);

ChatRoomView.displayName = "ChatRoomView";

export default ChatRoomView;