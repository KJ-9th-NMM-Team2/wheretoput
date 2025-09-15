import React, { useState, useEffect } from 'react';
import { TotalPrice } from './price/TotalPrice';
import { CategoryProps } from '@/lib/furnitureTypes';
import { useStore } from '../useStore';

interface SideCategoriesProps {
  collapsed: boolean;
  onCategorySelect: (category: string) => void;
  totalPrice: number;
}

const SideCategories: React.FC<SideCategoriesProps> = ({ collapsed, onCategorySelect, totalPrice }) => {

  // 실제 DB의 categories 테이블과 일치하도록 수정완료
  // # -2  = 가구 , -1 = 선택된 가구(장바구니)
  // # 0 = chairs , 1 = Lighting
  // # 2 = Storage , 3 = Tables
  // # 4 = Decor , 5 = Bathroom
  // # 6 = Kitchen , 7 = Appliances
  // # 8 = Sofas, 9 = Construction
  // # 10 = Bedroom , 11 = Outdoor
  // # 12 = Home Decor
  const categories: CategoryProps[] = [
    { id: 99, name: "전체" },
    { id: -2, name: "가구" }, 
    { id: 0, name: "의자" }, 
    { id: 1, name: "조명" }, 
    { id: 3, name: "테이블" }, 
    { id: 4, name: "데코" }, 
    { id: 5, name: "욕실용품" }, 
    { id: 7, name: "가전·디지털" }, 
    { id: 9, name: "설치 가구" }, 
    { id: 10, name: "침구류" }, 

  ];
  const { selectedCategory, setSelectedCategory, wallToolMode } = useStore();

  // 컴포넌트 마운트 시 기본 카테고리 선택
  useEffect(() => {
    // 기본값으로 첫 번째 카테고리 선택
    onCategorySelect(categories[0].id.toString());
  }, []); // 빈 배열로 한 번만 실행


  const handleCategoryClick = (category: CategoryProps) => {
    // 벽 추가 모드가 활성화된 경우 카테고리 선택 방지
    if (wallToolMode) {
      return;
    }
    setSelectedCategory(category.id);
    onCategorySelect(category.id.toString());
  };

  if (collapsed) {
    return null;
  }

  return (
    <div className="flex-shrink-0 border-b border-gray-300">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-600">카테고리</h3>
          <TotalPrice totalPrice={totalPrice} />
        </div>

        {/* 카테고리 - 드래그 스크롤 */}
        <div className="relative mb-4">
          <div
            className="overflow-x-auto overflow-y-hidden"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db #f3f4f6'
            }}
          >
            <div className="flex gap-2 pb-2" style={{ width: 'max-content' }}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`py-2 px-3 text-sm rounded transition whitespace-nowrap flex-shrink-0 ${
                    wallToolMode
                      ? 'cursor-not-allowed opacity-50 bg-gray-100 text-gray-400'
                      : 'cursor-pointer'
                  } ${selectedCategory === cat.id && !wallToolMode
                      ? 'bg-blue-500 text-white'
                      : !wallToolMode
                        ? 'bg-white text-gray-800 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-gray-200'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                  onClick={() => handleCategoryClick(cat)}
                  disabled={wallToolMode}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideCategories;