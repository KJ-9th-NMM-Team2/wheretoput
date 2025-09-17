'use client';

import React from 'react';
import { useHistory } from './HistoryManager';
import SelectedFurnitures from '../side/item/SelectedFurniture';
import { Undo2, Redo2 } from 'lucide-react';

interface HistoryControlsProps {
  className?: string;
  collapsed?: boolean;
  onCategorySelect: (category: string) => void;
}

export function HistoryControls(
  { className, collapsed = false, onCategorySelect }: HistoryControlsProps) {
  const { undo, redo, canUndo, canRedo } = useHistory();

  if (collapsed) {
    return (
      <div className={`flex flex-col gap-1 p-1 ${className}`}>
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`w-8 h-6 tool-btn ${canUndo ? 'tool-btn-active' : 'tool-btn-inactive'} disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center hover:!transform-none hover:!shadow-md`}
          title="실행 취소 (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className={`w-8 h-6 tool-btn ${canRedo ? 'tool-btn-green-active' : 'tool-btn-inactive'} disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center hover:!transform-none hover:!shadow-md`}
          title="다시 실행 (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex justify-between items-center gap-2 p-3 border-b border-gray-200 ${className}`}>
      <div className="flex gap-2">

        <button
          onClick={undo}
          disabled={!canUndo}
          className={`px-3 py-1.5 tool-btn ${canUndo ? 'tool-btn-active' : 'tool-btn-inactive'} text-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1 hover:!transform-none hover:!shadow-md`}
          title="실행 취소 (Ctrl+Z)"
        >
          <Undo2 size={16} />
          Undo
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className={`px-3 py-1.5 tool-btn ${canRedo ? 'tool-btn-green-active' : 'tool-btn-inactive'} text-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1 hover:!transform-none hover:!shadow-md`}
          title="다시 실행 (Ctrl+Y)"
        >
          <Redo2 size={16} />
          Redo
        </button>
      </div>
      <SelectedFurnitures onCategorySelect={onCategorySelect} />
    </div>
  );
}