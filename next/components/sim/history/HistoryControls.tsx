'use client';

import React from 'react';
import { useHistory } from './HistoryManager';
import SelectedFurnitures from '../side/item/SelectedFurniture';

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
      <div className={`flex flex-col gap-1 p-2 ${className}`}>
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`w-6 h-6 tool-btn ${canUndo ? 'tool-btn-active' : 'tool-btn-inactive'} disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center hover:!transform-none hover:!shadow-md`}
          title="실행 취소 (Ctrl+Z)"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 14l-4-4 4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5 10h11a4 4 0 010 8h-1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className={`w-6 h-6 tool-btn ${canRedo ? 'tool-btn-green-active' : 'tool-btn-inactive'} disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center hover:!transform-none hover:!shadow-md`}
          title="다시 실행 (Ctrl+Y)"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 14l4-4-4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19 10H8a4 4 0 000 8h1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 14l-4-4 4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5 10h11a4 4 0 010 8h-1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Undo
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className={`px-3 py-1.5 tool-btn ${canRedo ? 'tool-btn-green-active' : 'tool-btn-inactive'} text-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1 hover:!transform-none hover:!shadow-md`}
          title="다시 실행 (Ctrl+Y)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 14l4-4-4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19 10H8a4 4 0 000 8h1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Redo
        </button>
      </div>
      <SelectedFurnitures onCategorySelect={onCategorySelect} />
    </div>
  );
}