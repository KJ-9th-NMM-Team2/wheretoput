'use client';// 클라이언트 컴포넌트라는 것을 명시 // 이거 안하면 렌더링 안됨

import React, { useState } from "react";
import SideTitle from '@/components/sim/side/SideTitle';
import SideSearch from '@/components/sim/side/SideSearch';
import SideCategories from '@/components/sim/side/SideCategories';
import SideSort from '@/components/sim/side/SideSort';
import SideItems from '@/components/sim/side/SideItems';
import type { furnitures as Furniture } from '@prisma/client';

const SimSideView: React.FC<string> = (roomId) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>();
  const [searchResults, setSearchResults] = useState<Furniture[]>([]); // 검색 결과 상태 추가
  const [totalPrice, setTotalPrice] = useState(0);
  const [sortOption, setSortOption] = useState<string>('updated_desc');

  const handleCategorySelect = (category: string) => {
    setSearchResults([]);
    setSelectedCategory(category);
  }

  const handleSearchResults = (results: Furniture[]) => {
    setSearchResults(results);
    // 검색 결과에 따른 다른 로직 수행
  };

  const handleSortChange = (sortValue: string) => {
    setSortOption(sortValue);
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
        <SideSearch collapsed={collapsed} onSearchResults={handleSearchResults} resetQuery={searchQuery} selectedCategory={selectedCategory} />
        <SideCategories 
          collapsed={collapsed}
          onCategorySelect={handleCategorySelect}
          setSearchQuery={setSearchQuery}
          totalPrice={totalPrice}
        />
        
        <SideSort 
          collapsed={collapsed}
          onSortChange={handleSortChange}
          currentSort={sortOption}
        />

        {/* 스크롤 가능한 메뉴 영역 - 나머지 공간을 모두 차지 */}
        <SideItems 
          collapsed={collapsed} 
          selectedCategory={selectedCategory} 
          furnitures={searchResults} 
          setTotalPrice={setTotalPrice} 
          sortOption={sortOption}
        />
      </div>
    </div>
  );
};

export default SimSideView;