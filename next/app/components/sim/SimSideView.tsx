'use client';// 클라이언트 컴포넌트라는 것을 명시 // 이거 안하면 렌더링 안됨

import React, { useState } from "react";
import SideTitle from './side/SideTitle';
import SideSearch from './side/SideSearch';
import SideCategories from './side/SideCategories';
import SideItems from './side/SideItems';
import BedroomPage from "../../bedroom/page"

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

      <BedroomPage></BedroomPage>
    </div>
  );
};

export default SimSideView;