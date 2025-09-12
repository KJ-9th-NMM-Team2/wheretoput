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

  const {
    addModel,
    loadedModels,
    selectModel,
    startPreviewMode,
    previewMode,
    cancelPreview,
  } = useStore();
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
        const result = await fetchSelectedFurnitures(
          furnitureId,
          roomId,
          sortOption
        );

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

  // 아이템 클릭 핸들러 - 즉시 프리뷰 모드 시작
  const handleItemClick = useCallback(
    (item: Furniture) => {
      // 프리뷰 모드 중이면 기존 프리뷰 취소하고 새 모델로 교체
      if (previewMode) {
        console.log("프리뷰 모드 중 - 모델 교체");
        cancelPreview(); // 기존 프리뷰 취소
      }

      // 즉시 프리뷰용 모델 데이터 생성 (기본 모델 URL 사용)
      const previewModel = createNewModel(item, null); // 일단 null로 시작
      const modelId = crypto.randomUUID();
      const modelWithId = {
        ...previewModel,
        id: modelId,
        // 원본 아이템 정보 저장 (히스토리용)
        _originalItem: item,
        _addAction: addAction,
      };

      // AbortController 생성
      const abortController = new AbortController();

      // 약간의 딜레이 후 프리뷰 모드 시작 (상태 충돌 방지)
      setTimeout(() => {
        startPreviewMode(modelWithId, abortController);
      }, 10);

      // 백그라운드에서 실제 모델 URL 가져오기
      const loadingToastId = toast.loading(`${item.name} 모델 로딩 중...`);

      fetch("/api/model-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ furniture_id: item.furniture_id }),
        signal: abortController.signal, // AbortController 신호 추가
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.success && result.model_url) {
            // 실제 모델 URL을 가져왔으면 업데이트
            const {
              setCurrentPreviewFurniture,
              currentPreviewFurniture,
              loadedModels,
              updateModelUrl,
            } = useStore.getState();

            // URL이 실제로 변경된 경우에만 업데이트 (null에서 실제 URL로 변경시에만)
            if (
              currentPreviewFurniture &&
              currentPreviewFurniture.id === modelId &&
              !currentPreviewFurniture.url && // 현재 URL이 null이고
              result.model_url // 새 URL이 있을 때만
            ) {
              const updatedModel = {
                ...modelWithId,
                url: result.model_url,
              };
              setCurrentPreviewFurniture(updatedModel);
            } else {
              // 이미 배치된 모델이라면 배치된 모델의 URL 업데이트
              const placedModel = loadedModels.find((m) => m.id === modelId);
              if (placedModel) {
                updateModelUrl(modelId, result.model_url);
              }
              // 그렇지 않으면 이미 취소된 프리뷰의 fetch 결과이므로 무시
            }

            toast.success(`${item.name} 모델 로딩 완료`, {
              id: loadingToastId,
            });
          } else {
            toast.dismiss(loadingToastId);
          }
        })
        .catch((error) => {
          if (error.name === "AbortError") {
            console.log("모델 로딩이 취소되었습니다:", error);
            toast.dismiss(loadingToastId);
          } else {
            console.log("모델 URL 가져오기 실패, 기본 모델 사용:", error);
            toast.dismiss(loadingToastId);
          }
        });
    },
    [startPreviewMode, addAction, previewMode, cancelPreview]
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
