import { useState, useEffect } from 'react';
import { useStore } from './useStore.js';

interface AutoSaveIndicatorProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

//  자동저장 상태를 시각적으로 표시
//  저장 중일 때 메시지표시 , 3초후 사라짐
export default function AutoSaveIndicator({ position = 'bottom-right' }: AutoSaveIndicatorProps) {
  const isSaving = useStore((state) => state.isSaving);
  const lastSavedAt = useStore((state) => state.lastSavedAt);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (isSaving || lastSavedAt) {
      setShowIndicator(true);
      
      if (!isSaving && lastSavedAt) {
        const timer = setTimeout(() => {
          setShowIndicator(false);
        }, 3000); // 3초 후 숨김
        
        return () => clearTimeout(timer);
      }
    }
  }, [isSaving, lastSavedAt]);

  if (!showIndicator) return null;

  const positionStyles = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-left': 'bottom-4 left-4'
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div 
      className={`fixed z-50 px-3 py-2 rounded-lg shadow-lg transition-all duration-300 ${positionStyles[position]}`}
      style={{
        backgroundColor: isSaving ? '#3B82F6' : '#10B981',
        color: 'white',
        fontSize: '12px',
        opacity: showIndicator ? 1 : 0,
        transform: showIndicator ? 'translateY(0)' : 'translateY(10px)'
      }}
    >
      <div className="flex items-center gap-2">
        {isSaving ? (
          <>
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
            <span>저장 중...</span>
          </>
        ) : (
          <>
            <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
            <span>자동저장 완료 ({formatTime(lastSavedAt)})</span>
          </>
        )}
      </div>
    </div>
  );
}