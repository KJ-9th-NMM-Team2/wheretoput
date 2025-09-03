import React, { useState, useEffect } from 'react';
import { TotalPrice } from './price/TotalPrice';

interface SideCategoriesProps {
  collapsed: boolean;
  onCategorySelect: (category: string) => void;
  setSearchQuery: (query: string) => void;
  totalPrice: number;
}

interface Category {
  id: number;
  name: string;
}

const SideCategories: React.FC<SideCategoriesProps> = ({ collapsed, onCategorySelect, setSearchQuery, totalPrice}) => {
  // 실제 DB의 categories 테이블과 일치하도록 수정완료
  // # -2  = 가구 , -1 = 선택된 가구(장바구니)
  // # 0 = chairs , 1 = Lighting
  // # 2 = Storage , 3 = Tables
  // # 4 = Decor , 5 = Bathroom
  // # 6 = Kitchen , 7 = Appliances
  // # 8 = Sofas, 9 = Construction
  // # 10 = Bedroom , 11 = Outdoor
  // # 12 = Home Decor
  const categories: Category[] = [
    { id: -2, name: "가구" }, //수정완료
    { id: 5, name: "욕실용품" }, // 수정완료
    { id: 1, name: "조명" }, //수정완료
    { id: 4, name: "데코" }, //수정완료
    { id: 7, name: "가전제품" }, // 추가
    
    { id: -1, name: "선택된 가구" }, //수정완료

   
  ];

  const [selectedCategory, setSelectedCategory] = useState<number>(categories[0].id);

  // 컴포넌트 마운트 시 기본 카테고리 선택
  useEffect(() => {
    // 기본값으로 첫 번째 카테고리 선택
    onCategorySelect(categories[0].id.toString());
  }, []); // 빈 배열로 한 번만 실행

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category.id);
    onCategorySelect(category.id.toString());
    setSearchQuery("");
  };

  if (collapsed) {
    return null;
  }

  return (
    <div className="flex-shrink-0 border-b border-gray-300">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">카테고리</h3>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`py-2 px-3 text-sm rounded transition ${
                selectedCategory === cat.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-800 hover:bg-orange-200 hover:text-white border border-gray-200'
              }`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat.name}
            </button>
          ))}
          <TotalPrice totalPrice={totalPrice}></TotalPrice>
        </div>
      </div>
    </div>
  );
};

export default SideCategories;