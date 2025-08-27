// Tool panel component for create page
// Team: 종호
'use client';

import { useState } from 'react';
import Button from '../ui/Button';

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle';

export default function ToolPanel() {
  const [selectedTool, setSelectedTool] = useState<Tool>('pen');

  const tools = [
    { id: 'pen' as Tool, label: '펜' },
    { id: 'eraser' as Tool, label: '지우개' },
    { id: 'rectangle' as Tool, label: '사각형' },
    { id: 'circle' as Tool, label: '원' },
  ];

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">도구</h3>
      <div className="grid grid-cols-2 gap-2">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={selectedTool === tool.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedTool(tool.id)}
          >
            {tool.label}
          </Button>
        ))}
      </div>
    </div>
  );
}