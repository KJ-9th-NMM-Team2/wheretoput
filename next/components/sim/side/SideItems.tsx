import React, { useState, useEffect, useCallback } from 'react';
import type { furnitures as Furniture } from '@prisma/client';
import ItemPaging from './item/ItemPaging';
import ItemSection from './item/ItemSection';
import { useStore } from '@/app/sim/store/useStore';
import { createNewModel } from '@/utils/createNewModel';
import { handlePageChange } from '@/utils/handlePage';
import { fetchFurnitures } from '@/lib/api/fetchFurnitures';
import { calculatePagination } from '@/lib/paginagtion';
import { fetchSelectedFurnitures } from '@/lib/api/fetchSelectedFurnitures';

interface SideItemsProps {
    collapsed: boolean;
    selectedCategory: string | null;
    furnitures: Furniture[];
    setTotalPrice: (price: number) => void;
}

const SideItems: React.FC<SideItemsProps> = ({ collapsed, selectedCategory, furnitures, setTotalPrice }) => {
    const [items, setItems] = useState<Furniture[]>([]);
    const [selectedItems, setSelectedItems] = useState<Furniture[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
    const itemsPerPage = 8;
    const { addModel, loadedModels } = useStore();

    // API에서 데이터 가져오기 함수
    const fetchItems = useCallback(async (page: number, category: string | null) => {
        if (loading) return; // 이미 호출 중이면 리턴
        fetchFurnitures({
            setTotalPages,
            setTotalItems,
            setLoading,
            setError,
            setItems,
            page,
            itemsPerPage,
            category: category || null || ''
        });
    }, [itemsPerPage]);

    // 검색 했을 때 query 실행
    useEffect(() => {
        setItems(furnitures);
    }, [furnitures])

    // 페이지나 카테고리 변경 시 데이터 가져오기
    useEffect(() => {
        const handleCategoryChange = async () => {
            if (selectedCategory === '-1') {
                const pagination = calculatePagination(currentPage, 5, totalPages);
                setTotalItems(pagination.totalItems);
                setTotalPages(pagination.totalPages);
                const furnitureId = loadedModels.map((item: any) => item.furniture_id);
                const result = await fetchSelectedFurnitures(furnitureId);
                
                if (result) {
                    setSelectedItems(result.furnitures);
                    setTotalPrice(result.totalPrice);
                }
            } else {
                fetchItems(currentPage, selectedCategory);
                setSelectedItems([]);
                setTotalPrice(0);
            }
        }
        handleCategoryChange();
    }, [currentPage, selectedCategory, fetchItems]);

    // 카테고리 변경 시 첫 페이지로 리셋
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory]);

    // 페이지 변경 핸들러들
    const handlePrevPage = useCallback(() => {
        handlePageChange(currentPage, setCurrentPage, 'prev');
    }, [currentPage]);

    const handleNextPage = useCallback(() => {
        handlePageChange(currentPage, setCurrentPage, 'next', totalPages);
    }, [currentPage, totalPages]);

    // 아이템 클릭 핸들러
    const handleItemClick = useCallback(async (item: Furniture) => {
        console.log('Selected item:', item);

        try {
            const response = await fetch('/api/model-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ furniture_id: item.furniture_id })
            });

            const result = await response.json();

            if (result.success) {
                const newModel = createNewModel(item, result.model_url);
                addModel(newModel);
                // newModel.furniture_id
            } else {
                throw new Error(result.error || '3D 모델 생성 실패');
            }
        } catch (error) {
            console.error('3D 모델 생성 실패:', error);
            // fallback 처리
            const newModel = createNewModel(item);
            addModel(newModel);
        }
    }, [addModel]);

    // 이미지 에러 핸들러
    const handleImageError = useCallback((furnitureId: string) => {
        setImageErrors(prev => new Set(prev).add(furnitureId));
    }, []);

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
            />

            {/* 페이지네이션 */}
            <ItemPaging
                loading={loading}
                error={error}
                currentPage={currentPage}
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