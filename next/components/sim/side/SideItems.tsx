import React, { useState, useEffect, useCallback } from "react";
import type { furnitures as Furniture } from "@prisma/client";
import ItemPaging from "./item/ItemPaging";
import ItemSection from "./item/ItemSection";
import { useStore } from "@/components/sim/useStore";
import { createNewModel } from "@/utils/createNewModel";
import { handlePageChange } from "@/utils/handlePage";
import { fetchFurnitures } from "@/lib/api/fetchFurnitures";
import { fetchSelectedFurnitures } from "@/lib/api/fetchSelectedFurnitures";
import { useHistory } from "@/components/sim/history";
import { ActionType } from "@/components/sim/history/types";
import toast from "react-hot-toast";

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
  const { addModel, loadedModels, selectModel } = useStore();
  const { addAction } = useHistory();

  // API에서 데이터 가져오기 함수
  const fetchItems = useCallback(
    async (page: number, category: string | null, sort: string) => {
      if (loading) return; // 이미 호출 중이면 리턴
      fetchFurnitures({
        setTotalPages,
        setTotalItems,
        setLoading,
        setError,
        setItems,
        query,
        page,
        itemsPerPage,
        category: category || null || "",
        sort: sort,
      });
    },
    [itemsPerPage, query]
  );

  // 검색 했을 때 query 실행
  useEffect(() => {
    setItems(furnitures);
  }, [furnitures]);

  // 페이지나 카테고리 변경 시 데이터 가져오기
  useEffect(() => {
    const handleCategoryChange = async () => {
      fetchItems(page, selectedCategory, sortOption);
      setSelectedItems([]);
      setTotalPrice(0);
    };
    handleCategoryChange();
  }, [page, selectedCategory, sortOption, fetchItems]);

  // 카테고리나 정렬 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, sortOption]);

  // loadedModels 변경 시 배치한 가구목록 새로고침
  useEffect(() => {
    const refreshSelectedItems = async () => {
      if (selectedCategory === "-1") {
        const furnitureId = loadedModels.map((item: any) => item.furniture_id);
        const result = await fetchSelectedFurnitures(furnitureId, roomId, sortOption);

        if (result) {
          setSelectedItems(result.furnitures);
          setTotalPrice(result.totalPrice);
        }
      }
    };
    refreshSelectedItems();
  }, [loadedModels, selectedCategory, sortOption, setTotalPrice]);

  // 페이지 변경 핸들러들
  const handlePrevPage = useCallback(() => {
    handlePageChange(page, setPage, "prev");
  }, [page]);

  const handleNextPage = useCallback(() => {
    handlePageChange(page, setPage, "next", totalPages);
  }, [page, totalPages]);

  // 아이템 클릭 핸들러
  const handleItemClick = useCallback(
    async (item: Furniture) => {
      const start = performance.now(); // 가져오기 - 타임 시작
      const toastId = toast.loading(`${item.name} 생성 중...`);

      try {
        const response = await fetch("/api/model-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ furniture_id: item.furniture_id }),
        });
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        console.log('Response ok:', response.ok);
        
        const end = performance.now(); // 가져오기 - 타임 끝
        const duration = end - start;
        console.log(`[${item.name}] [생성 시간]: ${duration}ms`);
        
        const result = await response.json();

        if (result.success) {
          const newModel = createNewModel(item, result.model_url);
          const modelId = crypto.randomUUID();
          const modelWithId = { ...newModel, id: modelId };

          toast.success(`${item.name} 생성 완료`, { id: toastId });
          addModel(modelWithId);

          // 히스토리에 가구 추가 액션 기록
          addAction({
            type: ActionType.FURNITURE_ADD,
            data: {
              furnitureId: modelId,
              previousData: modelWithId,
            },
            description: `${item.name} 추가`,
          });
        } else {
          throw new Error(result.error || `${item.name} 생성 실패`);
        }
      } catch (error) {
        console.error(`${item.name} 생성 실패:`, error);
        toast.error(`${item.name} 생성 실패:`, { id: toastId });
        // fallback 처리
        const newModel = createNewModel(item);
        const modelId = crypto.randomUUID();
        const modelWithId = { ...newModel, id: modelId };

        addModel(modelWithId);

        // 히스토리에 가구 추가 액션 기록
        addAction({
          type: ActionType.FURNITURE_ADD,
          data: {
            furnitureId: modelId,
            previousData: modelWithId,
          },
          description: `${item.name} 추가`,
        });
      }
    },
    [addModel, addAction]
  );

  // 이미지 에러 핸들러
  const handleImageError = useCallback((furnitureId: string) => {
    setImageErrors((prev) => new Set(prev).add(furnitureId));
  }, []);

  // 가구 선택 핸들러 (배치한 가구목록에서 카드 클릭 시)
  const handleSelectModel = useCallback(
    (item: Furniture) => {
      // loadedModels에서 해당 furniture_id를 가진 모델 찾기
      const modelToSelect = loadedModels.find(
        (model) => model.furniture_id === item.furniture_id
      );

      if (modelToSelect) {
        selectModel(modelToSelect.id);
      }
    },
    [loadedModels, selectModel]
  );

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
        handleItemClick={handleItemClick}
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
