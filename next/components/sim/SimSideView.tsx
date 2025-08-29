'use client';// 클라이언트 컴포넌트라는 것을 명시 // 이거 안하면 렌더링 안됨

import React, { useState } from "react";
import SideTitle from '@/components/sim/side/SideTitle';
import SideSearch from '@/components/sim/side/SideSearch';
import SideCategories from '@/components/sim/side/SideCategories';
import SideItems from '@/components/sim/side/SideItems';
import { Furnitures } from '@prisma/client';

const SimSideView: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>();
  const [searchResults, setSearchResults] = useState<Furnitures[]>([]); // 검색 결과 상태 추가
  

  const handleCategorySelect = (category: string) => {
    setSearchResults([]);
    setSelectedCategory(category);
  }

  const handleSearchResults = (results: Furnitures[]) => {
    setSearchResults(results);
    // 검색 결과에 따른 다른 로직 수행
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <div
        className={`${
          // 접힙: 펼침
          collapsed ? "w-10" : "w-80" 
        } bg-white text-black transition-all duration-300 flex flex-col border-r border-gray-200`} // border 추가로 구분선
      >
        {/* 고정 영역들 */}
        <SideTitle collapsed={collapsed} setCollapsed={setCollapsed} />
        <SideSearch collapsed={collapsed} onSearchResults={handleSearchResults} resetQuery={searchQuery} />
        <SideCategories 
          collapsed={collapsed}
          onCategorySelect={handleCategorySelect}
          setSearchQuery={setSearchQuery}
        />

        {/* 스크롤 가능한 메뉴 영역 - 나머지 공간을 모두 차지 */}
        <SideItems collapsed={collapsed} selectedCategory={selectedCategory} furnitures={searchResults}/>
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      {/* <div className="flex-1"> */}
        {/* 여기에 3D Canvas나 메인 콘텐츠가 들어갑니다 */}
      {/* </div> */}
    </div>
  );
};

export default SimSideView;