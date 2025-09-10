import React from 'react';
import { useStore } from '../useStore';

interface WallToolsProps {
  collapsed: boolean;
}

const WallTools: React.FC<WallToolsProps> = ({ collapsed }) => {
  const { wallToolMode, setWallToolMode } = useStore();

  const wallTools = [
    { id: 'add', name: '벽 추가', icon: '🧱', description: '새로운 벽을 추가합니다' },
    { id: 'edit', name: '벽 편집', icon: '✏️', description: '기존 벽의 크기와 위치를 조정합니다' },
    { id: 'delete', name: '벽 삭제', icon: '🗑️', description: '선택한 벽을 삭제합니다' },
  ];

  const handleToolSelect = (toolId: string) => {
    // 같은 도구를 다시 클릭하면 선택 해제
    if (wallToolMode === toolId) {
      setWallToolMode(null);
    } else {
      setWallToolMode(toolId);
    }
  };

  if (collapsed) {
    return null;
  }

  return (
    <div className="flex-shrink-0 border-b border-gray-300">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-600">벽 도구</h3>
          {wallToolMode && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              활성화됨
            </span>
          )}
        </div>

        <div className="space-y-2">
          {wallTools.map((tool) => (
            <button
              key={tool.id}
              className={`w-full p-3 text-left rounded-lg border transition-all duration-200 ${
                wallToolMode === tool.id
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-orange-50 hover:border-orange-200'
              }`}
              onClick={() => handleToolSelect(tool.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{tool.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{tool.name}</div>
                  <div className={`text-xs mt-1 ${
                    wallToolMode === tool.id ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {tool.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {wallToolMode && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-blue-800">
              {wallToolMode === 'add' && (
                <>
                  <div className="font-medium mb-1">벽 추가 모드</div>
                  <div>바닥을 클릭하여 시작점을 선택하고, 다시 클릭하여 끝점을 선택하세요.</div>
                </>
              )}
              {wallToolMode === 'edit' && (
                <>
                  <div className="font-medium mb-1">벽 편집 모드</div>
                  <div>편집할 벽을 클릭하세요. 크기와 위치를 조정할 수 있습니다.</div>
                </>
              )}
              {wallToolMode === 'delete' && (
                <>
                  <div className="font-medium mb-1">벽 삭제 모드</div>
                  <div>삭제할 벽을 클릭하세요. 선택한 벽이 제거됩니다.</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WallTools;