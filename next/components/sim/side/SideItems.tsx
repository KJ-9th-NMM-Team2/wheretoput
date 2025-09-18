import React, { useState, useEffect, useCallback } from "react";
import type { furnitures as Furniture } from "@prisma/client";
import ItemPaging from "./item/ItemPaging";
import ItemSection from "./item/ItemSection";
import { useStore } from "@/components/sim/useStore";
import { useHandleCategoryChange } from "./item/hooks/useHandleCategoryChange";
import { useRefreshSelectedItems } from "./item/hooks/useRefreshSelectedItems";
import { useHandlePage } from "./item/hooks/useHandlePage";
import { useHandleSelectModel } from "./item/hooks/useHandleSelectModel";

interface SideItemsProps {
  collapsed: boolean;
  selectedCategory: string | null;
  furnitures: Furniture[];
  sortOption: string;
  roomId: string;
  itemsPerPage: number;
  page: number;
  totalPages: number;
  totalItems: number;
  query: string;
  loading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  setTotalPages: (totalPage: number) => void;
  setTotalItems: (itemCount: number) => void;
  setTotalPrice: (price: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const SideItems: React.FC<SideItemsProps> = ({
  collapsed,
  selectedCategory,
  furnitures,
  sortOption,
  roomId,
  itemsPerPage,
  page,
  totalPages,
  totalItems,
  query,
  loading,
  error,
  setPage,
  setTotalPages,
  setTotalItems,
  setTotalPrice,
  setLoading,
  setError,
}) => {
  const [items, setItems] = useState<Furniture[]>([]);
  const [selectedItems, setSelectedItems] = useState<Furniture[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const {
    loadedModels,
    selectModel,
  } = useStore();

  const sendItems = {
    loading, query, itemsPerPage, setTotalPages, setTotalItems, 
    setLoading, setError, setItems
  };

  const sendCategoryChangeArguments = {
    page, selectedCategory, sortOption, setSelectedItems, setTotalPrice, setPage
  }

  const sendRefreshSelectedItems = {
    loadedModels, selectedCategory, roomId, sortOption, setSelectedItems, setTotalPrice
  }

  // 검색 했을 때 query 실행
  useEffect(() => {
    setItems(furnitures);
  }, [furnitures]);

  // 페이지나 카테고리 변경 시 데이터 가져오기 // 이 함수에 (API에서 데이터 가져오기 함수) 포함
  useHandleCategoryChange(sendItems, sendCategoryChangeArguments);

  // 카테고리나 정렬 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, sortOption]);

  // loadedModels 변경 시 배치한 가구목록 새로고침
  useRefreshSelectedItems(sendRefreshSelectedItems);

  const handleNextPage = useHandlePage({ page, totalPages, setPage, option: "next" })

  const handlePrevPage = useHandlePage({ page, setPage, option: "prev" })

  // 이미지 에러 핸들러
  const handleImageError = useCallback((furnitureId: string) => {
    setImageErrors((prev) => new Set(prev).add(furnitureId));
  }, []);

  const handleSelectModel = useHandleSelectModel({ loadedModels, selectModel});

  // collapsed 상태일 때는 아무것도 렌더링하지 않음
  if (collapsed) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden border-t border-gray-200">
      <ItemSection
        loading={loading}
        error={error}
        filteredItems={items} // 서버에서 받은 현재 페이지 데이터
        selectedItems={selectedItems}
        imageErrors={imageErrors}
        selectedCategory={selectedCategory}
        handleImageError={handleImageError}
        handleSelectModel={handleSelectModel}
        roomId={roomId}
      />

      {/* 페이지네이션 */}
      <ItemPaging
        loading={loading}
        error={error}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        handlePrevPage={handlePrevPage}
        handleNextPage={handleNextPage}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};

export default SideItems;
