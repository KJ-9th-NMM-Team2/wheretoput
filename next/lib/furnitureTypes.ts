// 공통 베이스 인터페이스
export interface BaseCategoryProps {
    id: number;
    name: string;
    selectedFurniture: any[];
    selectedCategory: number;
    handleCategoryClick: (category: CategoryProps) => void;
}

// 각 컴포넌트별 필요한 속성만 선택
export type CategoryProps = Pick<BaseCategoryProps, 
    'id' | 'name'
>;