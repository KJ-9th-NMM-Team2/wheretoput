'use client';// 클라이언트 컴포넌트라는 것을 명시 // 이거 안하면 렌더링 안됨

import React, { useState } from "react";
import SideTitle from './side/SideTitle';
import SideSearch from './side/SideSearch';
import SideCategories from './side/SideCategories';
import SideItems from './side/SideItems';

const SimSideView: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  }

  return (
    <div className="flex h-screen overflow-hidden"> {/* min-h-screen → h-screen, overflow-hidden 추가 */}
      {/* Sidebar */}
      <div
        className={`${
          // 접힙: 펼침
          collapsed ? "w-[5%]" : "w-[22%]" 
        } bg-white text-black transition-all duration-300 flex flex-col border-r border-gray-200`} // border 추가로 구분선
      >
        {/* 고정 영역들 */}
        <SideTitle collapsed={collapsed} setCollapsed={setCollapsed} />
        <SideSearch collapsed={collapsed} />
        <SideCategories collapsed={collapsed} onCategorySelect={handleCategorySelect} />

        {/* 스크롤 가능한 메뉴 영역 - 나머지 공간을 모두 차지 */}
        <SideItems collapsed={collapsed} selectedCategory={selectedCategory}/>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden"> {/* overflow-hidden 추가 */}
        <header className="h-14 bg-gray-100 flex items-center px-4 shadow flex-shrink-0"> {/* flex-shrink-0 추가 */}
          <h1 className="text-lg font-semibold">Header</h1>
        </header>
        
        <main className="flex-1 overflow-auto bg-gray-50"> {/* overflow-auto로 스크롤 가능 */}
          <div className="p-6">
            <div className="bg-white p-6 rounded-lg shadow">
              Bill is a cat.
            </div>
          </div>
        </main>
        
        <footer className="h-12 flex items-center justify-center bg-gray-100 text-sm text-gray-500 flex-shrink-0"> {/* flex-shrink-0 추가 */}
          Tailwind Layout ©{new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
};

export default SimSideView;