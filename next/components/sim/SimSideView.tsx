"use client"; // 클라이언트 컴포넌트라는 것을 명시 // 이거 안하면 렌더링 안됨

import React, { useState } from "react";
import SideTitle from "@/components/sim/side/SideTitle";
import SideSearch from "@/components/sim/side/SideSearch";
import SideCategories from "@/components/sim/side/SideCategories";
import SideSort from "@/components/sim/side/SideSort";
import SideItems from "@/components/sim/side/SideItems";
import { HistoryControls, useHistoryKeyboard } from "@/components/sim/history";
import type { furnitures as Furniture } from "@prisma/client";
import { RoomInfo } from "@/lib/services/roomService";


const SideViewContent: React.FC<{roomId: string, accessType: number, onEditClick: () => void; newRoomInfo: RoomInfo }> = ({ roomId, accessType, onEditClick, newRoomInfo }) => {

  const [collapsed, setCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>();
  const [searchResults, setSearchResults] = useState<Furniture[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [sortOption, setSortOption] = useState<string>('updated_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 8;

  useHistoryKeyboard();

  const handleCategorySelect = (category: string) => {
    setSearchResults([]);
    setSelectedCategory(category);
    setSearchQuery("");
  };

  const handleSortChange = (sortValue: string) => {
    setSortOption(sortValue);
  };

  return (
    <div className="flex">
      <div
        className={`${
          // 사이드바 크기 조정 : 원본 w-80 -> w72
          collapsed ? "w-10" : "w-80"
        } bg-white text-black transition-all duration-300 flex flex-col border-r border-gray-200 select-none shadow-2xl drop-shadow-xl backdrop-blur-sm`}
      >
        <SideTitle
          newRoomInfo={newRoomInfo}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          accessType={accessType}
          onEditClick={onEditClick}
        />



        <SideSearch 
          collapsed={collapsed}
          resetQuery={searchQuery}
          searchQuery={searchQuery || ""}
          selectedCategory={selectedCategory}
          page={page}
          itemsPerPage={itemsPerPage}
          loading={loading}
          setPage={setPage}
          setTotalItems={setTotalItems}
          setLoading={setLoading}
          setSearchResults={setSearchResults}
          setSearchQuery={setSearchQuery}
        />
        
        <SideCategories 
          collapsed={collapsed}
          onCategorySelect={handleCategorySelect}
          totalPrice={totalPrice}
        />

        <SideSort
          collapsed={collapsed}
          onSortChange={handleSortChange}
          currentSort={sortOption}
        />

        {/* 히스토리 컨트롤 - 카테고리 바로 위에 배치 */}
        <HistoryControls
          collapsed={collapsed}
          onCategorySelect={handleCategorySelect}
        />


        <SideItems 
          collapsed={collapsed} 
          selectedCategory={selectedCategory} 
          furnitures={searchResults} 
          sortOption={sortOption}
          roomId={roomId}
          itemsPerPage={itemsPerPage}
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          query={searchQuery || ""}
          loading={loading}
          error={error}
          setPage={setPage}
          setTotalPages={setTotalPages}
          setTotalItems={setTotalItems}
          setTotalPrice={setTotalPrice} 
          setLoading={setLoading}
          setError={setError}
        />
      </div>
    </div>
  );
};

const SimSideView: React.FC<{ roomId: string | null; accessType: number; onEditClick: () => void; newRoomInfo: RoomInfo }> = ({
  roomId,
  accessType,
  onEditClick,
  newRoomInfo,
}) => {
  if (!roomId) {
    return null; // roomId가 없으면 아무것도 렌더링하지 않음
  }

  return <SideViewContent roomId={roomId} accessType={accessType} onEditClick={onEditClick} newRoomInfo={newRoomInfo}/>;
};

export default SimSideView;
