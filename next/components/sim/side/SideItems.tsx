import React, { useState, useEffect, useCallback } from 'react';
import type { furnitures as Furniture } from '@prisma/client';
import ItemPaging from './item/ItemPaging';
import ItemScroll from './item/ItemScroll';
import { useStore } from '@/app/sim/store/useStore';

interface SideItemsProps {
    collapsed: boolean;
    selectedCategory: string | null;
    furnitures: Furniture[];
}

const SideItems: React.FC<SideItemsProps> = ({ collapsed, selectedCategory, furnitures}) => {
    const [items, setItems] = useState<Furniture[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
    const itemsPerPage = 5;
    const { addModel } = useStore();

    // API에서 데이터 가져오기 함수
    const fetchItems = useCallback(async (page: number, category: string | null) => {
        if (loading) return; // 이미 호출 중이면 리턴
        try {
            setLoading(true);
            setError(null);

            // URL 파라미터 구성
            const params = new URLSearchParams({
                page: page.toString(),
                limit: itemsPerPage.toString(),
            });

            // 카테고리가 선택되었다면 파라미터에 추가
            if (category) {
                params.append('category', category);
            }

            const response = await fetch(`/api/sim/furnitures?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            // 개선된 API 응답 구조 처리
            if (data.items && data.pagination) {
                // 새로운 API 응답 형식
                setItems(data.items);
                setTotalItems(data.pagination.totalItems);
                setTotalPages(data.pagination.totalPages);
            }
            console.log(`data check : ${data}`);

        } catch (err) {
            console.error('Failed to fetch items:', err);
            setError(err instanceof Error ? err.message : 'Failed to load items');
            setItems([]);
            // setTotalItems(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]);

    // 검색 했을 때 query 실행
    useEffect(() => {
        setItems(furnitures);
    }, [furnitures])

    // 페이지나 카테고리 변경 시 데이터 가져오기
    useEffect(() => {
        fetchItems(currentPage, selectedCategory);
    }, [currentPage, selectedCategory, fetchItems]);

    // 카테고리 변경 시 첫 페이지로 리셋
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory]);

    // 페이지 변경 핸들러들
    const handlePrevPage = useCallback(() => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    }, [currentPage]);

    const handleNextPage = useCallback(() => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    }, [currentPage, totalPages]);

    // 아이템 클릭 핸들러
    const handleItemClick = useCallback(async (item: Furniture) => {
        console.log('Selected item:', item);
    
        // 3D 모델 생성 API 호출
        try {
            const response = await fetch('/api/model-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ furniture_id: item.furniture_id })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // 생성된 또는 기존 모델 URL 사용
                const newModel = {
                    url: result.model_url,
                    name: item.name,
                    length_x: item.length_x,
                    length_y: item.length_y,
                    length_z: item.length_z,
                    price: item.price,
                    brand: item.brand,
                    isCityKit: false,
                    texturePath: null,
                    position: [0, 0, 0] // 화면 중앙
                };
                addModel(newModel);
                console.log('3D 모델 추가 성공:', result.model_url);
            } else {
                throw new Error(result.error || '3D 모델 생성 실패');
            }
        } catch (error) {
            console.error('3D 모델 생성 실패:', error);
            // fallback으로 기존 파일 사용
            const newModel = {
                url: '/legacy_mesh (1).glb',
                name: item.name,
                length_x: item.length_x,
                length_y: item.length_y,
                length_z: item.length_z,
                price: item.price,
                brand: item.brand,
                isCityKit: false,
                texturePath: null,
                position: [0, 0, 0] // 화면 중앙
            };
            addModel(newModel);
            console.log('fallback 모델 사용');
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
            <ItemScroll 
                loading={loading}
                error={error}
                filteredItems={items} // 서버에서 받은 현재 페이지 데이터
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