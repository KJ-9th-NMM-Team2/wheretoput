'use client';

import { useEffect } from 'react';
import { useHistory } from './HistoryManager';

export function useHistoryKeyboard() {
  const { undo, redo, canUndo, canRedo } = useHistory();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      
      if (!isCtrlOrCmd) return;

      if (event.key === 'z' || event.key === 'Z') {
        if (event.shiftKey) {
          if (canRedo) {
            event.preventDefault();
            redo();
          }
        } else {
          if (canUndo) {
            event.preventDefault();
            undo();
          }
        }
      } else if (event.key === 'y' || event.key === 'Y') {
        if (canRedo) {
          event.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, canUndo, canRedo]);
}