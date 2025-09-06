import type { furnitures as Furniture } from '@prisma/client';

// 공통 베이스 인터페이스
export interface BaseItemProps {
    loading: boolean;
    error: string | null;
    filteredItems: Furniture[];
    selectedItems: Furniture[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    handlePrevPage: () => void;
    handleNextPage: () => void;
    itemsPerPage: number;
    imageErrors: Set<string>;
    selectedCategory: string | null;
    handleItemClick: (item: Furniture, delta: number) => void;
    handleImageError: (itemId: string) => void;
    roomId: string,
}

// 각 컴포넌트별 필요한 속성만 선택
export type ItemSectionProps = Pick<BaseItemProps, 
    'loading' | 'error' | 'filteredItems' | 'selectedItems' | 'imageErrors' | 'selectedCategory' | 'handleItemClick' | 'handleImageError' | 'roomId'
> & {
    handleSelectModel?: (item: Furniture) => void;
};

export type ItemPagingProps = Pick<BaseItemProps, 
    'loading' | 'error' | 'currentPage' | 'totalPages' | 'totalItems' | 'handlePrevPage' | 'handleNextPage' | 'itemsPerPage'
>;