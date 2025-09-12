import React, { useState } from "react";
import { useStore } from "../useStore";

interface WallToolsProps {
  collapsed?: boolean;
  isDropdown?: boolean;
}

// 벽 도구 드롭다운 내용
const WallTools: React.FC<WallToolsProps> = ({
  collapsed = false,
  isDropdown = false,
}) => {
  const { wallToolMode, setWallToolMode } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const wallTools = [
    {
      id: "add",
      name: "벽 추가",
      icon: "",
      description: "새로운 벽을 추가합니다",
    },
    // { id: 'edit', name: '벽 편집', icon: '', description: '기존 벽의 크기와 위치를 조정합니다' },
    {
      id: "delete",
      name: "벽 삭제",
      icon: "",
      description: "선택한 벽을 삭제합니다",
    },
  ];

  const handleToolSelect = (toolId: string) => {
    // 같은 도구를 다시 클릭하면 선택 해제
    if (wallToolMode === toolId) {
      setWallToolMode(null);
    } else {
      setWallToolMode(toolId);
    }

    // 드롭다운에서는 선택 후에도 열려있게 유지
    // if (isDropdown) {
    //   setIsOpen(false);
    // }
  };

  const activeTool = wallTools.find((tool) => tool.id === wallToolMode);

  if (collapsed) {
    return null;
  }

  // 드롭다운 모드
  if (isDropdown) {
    return (
      <div className="absolute bottom-4 left-4 z-50 select-none">
        {/* 메인 버튼 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all duration-200 cursor-pointer ${
            wallToolMode
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-800 hover:bg-gray-50"
          } border border-gray-200`}
        >
          <span className="text-lg">{activeTool ? activeTool.icon : ""}</span>
          <span className="font-medium text-sm cursor-pointer">
            {activeTool ? activeTool.name : "벽 도구"}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* 드롭다운 메뉴 */}
        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            {wallTools.map((tool) => (
              <button
                key={tool.id}
                className={`w-full p-3 text-left hover:bg-gray-50 transition-colors cursor-pointer ${
                  wallToolMode === tool.id
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : ""
                }`}
                onClick={() => handleToolSelect(tool.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{tool.icon}</span>
                  <div className="flex-1">
                    <div
                      className={`font-medium text-sm ${
                        wallToolMode === tool.id
                          ? "text-blue-700"
                          : "text-gray-800"
                      }`}
                    >
                      {tool.name}
                    </div>
                  </div>
                  {wallToolMode === tool.id && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 기존 사이드바 모드
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
              className={`w-full p-3 text-left rounded-lg border transition-all duration-200 cursor-pointer ${
                wallToolMode === tool.id
                  ? "bg-blue-500 text-white border-blue-500 shadow-md"
                  : "bg-white text-gray-800 border-gray-200 hover:bg-orange-50 hover:border-orange-200"
              }`}
              onClick={() => handleToolSelect(tool.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{tool.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{tool.name}</div>
                  <div
                    className={`text-xs mt-1 ${
                      wallToolMode === tool.id
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
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
              {wallToolMode === "add" && (
                <>
                  <div className="font-medium mb-1">벽 추가 모드</div>
                  <div>
                    바닥을 클릭하여 시작점을 선택하고, 다시 클릭하여 끝점을
                    선택하세요.
                  </div>
                </>
              )}
              {wallToolMode === "edit" && (
                <>
                  <div className="font-medium mb-1">벽 편집 모드</div>
                  <div>
                    편집할 벽을 클릭하세요. 크기와 위치를 조정할 수 있습니다.
                  </div>
                </>
              )}
              {wallToolMode === "delete" && (
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
