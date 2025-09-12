import { CategoryProps } from "@/lib/furnitureTypes";
import { useStore } from "../../useStore";

interface SelectedFurnituresProps {
    onCategorySelect: (category: string) => void;
}

const SelectedFurnitures = ({ onCategorySelect }: SelectedFurnituresProps) => {
    const category = { id: -1, name: "배치한 가구 목록" };
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
                className={`py-2 px-3 text-sm rounded transition whitespace-nowrap cursor-pointer ${selectedCategory === category.id
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-800 hover:bg-green-50 hover:text-green-600 hover:border-green-200 border border-gray-200'

                    }`}
                onClick={() => handleCategoryClick(category)}
            >
                {category.name}
            </button>
        </div>
    </>
}
export default SelectedFurnitures;