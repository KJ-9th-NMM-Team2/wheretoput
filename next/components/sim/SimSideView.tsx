'use client';// 클라이언트 컴포넌트라는 것을 명시 // 이거 안하면 렌더링 안됨

import React, { useEffect, useState } from "react";
import SideTitle from '@/components/sim/side/SideTitle';
import SideSearch from '@/components/sim/side/SideSearch';
import SideCategories from '@/components/sim/side/SideCategories';
import SideItems from '@/components/sim/side/SideItems';
import type { furnitures as Furniture } from '@prisma/client';
import { useSession } from "next-auth/react";

const SimSideView: React.FC<string> = (roomId) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>();
  const [searchResults, setSearchResults] = useState<Furniture[]>([]); // 검색 결과 상태 추가
  const [isOwnUserRoom, setIsOwnUserRoom] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const checkOwnRoomOfUser = async () => {
      const { data: session, status } = useSession();
      if (status === "loading") return;
      if (!session?.user) return;

      if (session?.user?.name && session?.user?.id && session?.user?.image) {
        try {
          const response = await fetch(`/api/rooms/user?roomId=${roomId}&userId=${session.user.id}`)

          if (!response.ok) {
            throw new Error('Network response was not ok');
          }

          const result = await response.json();
          if (result) {
            setIsOwnUserRoom(true);
          } else {
            setIsOwnUserRoom(false);
          }
        } catch (error) {
          console.error('FETCH ERROR:', error)
        } 
      }
    }
    console.log(isOwnUserRoom);
    checkOwnRoomOfUser();
  }, []);

  const handleCategorySelect = (category: string) => {
    setSearchResults([]);
    setSelectedCategory(category);
  }

  const handleSearchResults = (results: Furniture[]) => {
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
          totalPrice={totalPrice}
        />

        {/* 스크롤 가능한 메뉴 영역 - 나머지 공간을 모두 차지 */}
        <SideItems collapsed={collapsed} selectedCategory={selectedCategory} furnitures={searchResults} setTotalPrice={setTotalPrice} />
      </div>
    </div>
  );
};

export default SimSideView;