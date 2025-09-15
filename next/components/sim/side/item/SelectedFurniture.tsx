import { CategoryProps } from "@/lib/furnitureTypes";
import { useStore } from "../../useStore";

interface SelectedFurnituresProps {
    onCategorySelect: (category: string) => void;
}

// 장바구니 , 배치한 가구 목록 , 나의 가구
const SelectedFurnitures = ({ onCategorySelect }: SelectedFurnituresProps) => {
    const category = { id: -1, name: "나의 가구" };
    const { selectedCategory, setSelectedCategory } = useStore();

    const handleCategoryClick = (category: CategoryProps) => {
        setSelectedCategory(category.id);
        onCategorySelect(category.id.toString());
    };
    return <>
        {/* 선택된 가구 & 합계 */}
        <div className="flex items-center">
            <button
                key={category.id}
                className={`py-2 px-3 text-sm tool-btn transition whitespace-nowrap cursor-pointer ${selectedCategory === category.id
                    ? 'tool-btn-green-active'
                    : 'tool-btn-inactive'

                    }`}
                onClick={() => handleCategoryClick(category)}
            >
                {category.name}
            </button>
        </div>
    </>
}
export default SelectedFurnitures;