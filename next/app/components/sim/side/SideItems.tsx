import React, { useState, useEffect } from 'react';
import type { Furniture } from '@prisma/client';
import ItemPaging from './item/ItemPaging';
import ItemScroll from './item/ItemScroll';
import ItemHeader from './item/ItemHeader';

interface SideItemsProps {
    collapsed: boolean;
    selectedCategory: string | null;
}

const SideItems: React.FC<SideItemsProps> = ({ collapsed, selectedCategory }) => {
    const [allItems, setAllItems] = useState<Furniture[]>([]);
    const [filteredItems, setFilteredItems] = useState<Furniture[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
    const itemsPerPage = 5;

    // API에서 데이터 가져오기
    useEffect(() => {
        const fetchItems = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch('/api/furnitures', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        // 인증 토큰이 필요한 경우
                        // 'Authorization': `Bearer ${token}`,
                    },
                    // credentials가 필요한 경우
                    // credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                // 디버깅: API 응답 구조 확인

                // API 응답이 배열인지 확인하고, 그렇지 않다면 적절히 처리
                const items = Array.isArray(data) ? data : data.items || data.data || data.furnitures || [];

                // is_active가 true인 아이템만 필터링 (선택사항)
                // const activeItems = items.filter((item: Furniture) =>
                //     item.is_active === true || item.is_active === undefined
                // );

                setAllItems(items);
                setFilteredItems(items);
            } catch (err) {
                console.error('Failed to fetch items:', err);
                setError(err instanceof Error ? err.message : 'Failed to load items');
                setAllItems([]);
                setFilteredItems([]);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, []);

    // 카테고리 선택 시 필터링
    useEffect(() => {
        console.log('Selected Category ID:', selectedCategory);
        console.log('All Items:', allItems);

        if (selectedCategory) {
            const filtered = allItems.filter(item => {
                // 디버깅: 각 아이템의 category_id 확인
                console.log(`Item ${item.name} - category_id:`, item.category_id, 'type:', typeof item.category_id);

                // category_id를 숫자로 비교
                return item.category_id === parseInt(selectedCategory);
            });
            console.log('Filtered Items:', filtered);
            setFilteredItems(filtered);
        } else {
            // selectedCategory가 없으면 전체 표시
            setFilteredItems(allItems);
        }
        setCurrentPage(1); // 카테고리 변경 시 첫 페이지로 리셋
    }, [selectedCategory, allItems]);

    // 페이지네이션 계산
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredItems.slice(startIndex, endIndex);

    // 페이지 변경 핸들러
    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    // 아이템 클릭 핸들러
    const handleItemClick = (item: Furniture) => {
        console.log('Selected item:', item);
        // 여기에 아이템 선택 시 처리 로직 추가
    };

    // 이미지 에러 핸들러
    const handleImageError = (furnitureId: string) => {
        setImageErrors(prev => new Set(prev).add(furnitureId));
    };

    // collapsed 상태일 때는 아무것도 렌더링하지 않음
    if (collapsed) {
        return null;
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden border-t border-gray-200">
            <ItemHeader loading={loading} filteredItems={filteredItems}/>
            
            <ItemScroll 
                loading={loading}
                error={error}
                filteredItems={filteredItems}
                imageErrors={imageErrors}
                selectedCategory={selectedCategory}
                handleItemClick={handleItemClick}
                handleImageError={handleImageError}
            />

            {/* 페이지네이션 */}
            <ItemPaging
                loading={loading}
                error={error}
                filteredItems={filteredItems}
                currentPage={currentPage}
                totalPages={totalPages}
                handlePrevPage={handlePrevPage}
                handleNextPage={handleNextPage}
                itemsPerPage={itemsPerPage}
            />
        </div>
    );
};

export default SideItems;