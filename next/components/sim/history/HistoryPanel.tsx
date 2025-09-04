'use client';

// [09.04] 이부분은 히스토리 패널 인데 현재 쓰진 않고있습니다. 


import React from 'react';
import { useHistory } from './HistoryManager';
import { ActionType } from './types';

interface HistoryPanelProps {
  className?: string;
  maxHeight?: string;
}

export function HistoryPanel({ className, maxHeight = '300px' }: HistoryPanelProps) {
  const { history, clearHistory } = useHistory();

  const getActionIcon = (type: ActionType) => {
    switch (type) {
      case ActionType.FURNITURE_ADD:
        return '➕';
      case ActionType.FURNITURE_REMOVE:
        return '🗑️';
      case ActionType.FURNITURE_MOVE:
        return '🔄';
      case ActionType.FURNITURE_ROTATE:
        return '🔃';
      case ActionType.FURNITURE_SCALE:
        return '📏';
      default:
        return '📝';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={`bg-white border border-gray-300 rounded-lg ${className}`}>
      <div className="p-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">히스토리</h3>
        <button
          onClick={clearHistory}
          className="text-xs text-red-600 hover:text-red-800 hover:underline"
          disabled={history.actions.length === 0}
        >
          전체 삭제
        </button>
      </div>
      
      <div 
        className="p-2" 
        style={{ maxHeight, overflowY: 'auto' }}
      >
        {history.actions.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            아직 히스토리가 없습니다
          </div>
        ) : (
          <div className="space-y-1">
            {history.actions.map((action, index) => (
              <div
                key={action.id}
                className={`p-2 rounded text-xs flex items-start gap-2 ${
                  index <= history.currentIndex
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50 border border-gray-200 opacity-60'
                }`}
              >
                <span className="text-sm" role="img" aria-label={action.type}>
                  {getActionIcon(action.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {action.description}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {formatTimestamp(action.timestamp)}
                  </div>
                  {action.data.furnitureId && (
                    <div className="text-gray-400 text-xs truncate">
                      ID: {action.data.furnitureId}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {history.actions.length > 0 && (
        <div className="p-2 border-t border-gray-200 text-xs text-gray-500 text-center">
          총 {history.actions.length}개 액션 | 현재 위치: {history.currentIndex + 1}
        </div>
      )}
    </div>
  );
}