// 채팅 플로팅 버튼 컴포넌트
// 채팅 팝업을 열고 닫는 플로팅 버튼

import { forwardRef } from "react";
import { motion } from "framer-motion";
import styles from "../ChatButton.module.scss";

interface ChatFloatingButtonProps {
  onClick: () => void;
  hasUnreadMessages?: boolean;
}

const ChatFloatingButton = forwardRef<HTMLButtonElement, ChatFloatingButtonProps>(
  ({ onClick, hasUnreadMessages = false }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={`${styles.button} relative`}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
        onClick={onClick}
        aria-label="채팅 열기"
      >
        💬
        {hasUnreadMessages && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-2 -right-2 bg-orange-500 rounded-full w-3 h-3 shadow-lg"
          />
        )}
      </motion.button>
    );
  }
);

ChatFloatingButton.displayName = "ChatFloatingButton";

export default ChatFloatingButton;