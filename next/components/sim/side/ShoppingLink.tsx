import React from 'react';
import { ExternalLink } from 'lucide-react';

interface ShoppingLinkProps {
  furnitureName: string;
  className?: string;
  children?: React.ReactNode;
  iconSize?: number;
  textSize?: string;
}

const ShoppingLink: React.FC<ShoppingLinkProps> = ({ 
  furnitureName, 
  className = "",
  children,
  iconSize = 12,
  textSize = "text-xs"
}) => {
  const handleShoppingClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지
    
    // 가구 이름을 URL 인코딩하여 네이버 쇼핑 검색으로 연결
    const encodedName = encodeURIComponent(furnitureName);
    const searchUrl = `https://shopping.naver.com/search/all?query=${encodedName}`;
    
    // 새 탭에서 열기
    window.open(searchUrl, '_blank');
  };

  return (
    <button
      onClick={handleShoppingClick}
      className={`
        inline-flex items-center gap-1 px-2 py-1 
        text-xs bg-blue-500 hover:bg-blue-600 
        text-white rounded transition-colors 
        ${className} cursor-pointer
      `}
      title={`${furnitureName} 온라인에서 찾기`}
    >
      {children || (
        <>
          <ExternalLink size={iconSize} />
          <span className={textSize}>구매하기</span>
        </>
      )}
    </button>
  );
};

export default ShoppingLink;