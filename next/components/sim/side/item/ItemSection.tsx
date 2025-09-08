import { ImageOff, Loader2 } from 'lucide-react';
import type { ItemSectionProps } from '@/lib/itemTypes';
import ShoppingLink from '@/components/sim/side/ShoppingLink';
import { useSession } from 'next-auth/react';
import { useStore } from '../../useStore';

const ItemSection: React.FC<ItemSectionProps> = ({
    loading,
    error,
    filteredItems,
    selectedItems,
    imageErrors,
    selectedCategory,
    handleItemClick,
    handleImageError,
    handleSelectModel,
    roomId,
}) => {
    const itemsToRender = selectedItems?.length > 0 ? selectedItems : filteredItems;
    const isSelectedCategory = selectedItems?.length > 0;
    const { data: session } = useSession();
    const { setAchievements } = useStore();

    const handleSaveFurniture = async (furniture: any) => {
        try {
            const response = await fetch('/api/sim/furnitures/click', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: session?.user?.id,
                    roomId,
                    newFurniture: furniture
                })
            });
            
            if (response.ok) {
                const achievementResult = await response.json();
                setAchievements(achievementResult.newlyUnlocked);
            }
        } catch (error) {
            console.error('업적 처리 에러:', error);
        }
    }
    return <>
        {/* 아이템 목록 - 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            ) : error ? (
                <div className="text-center py-8">
                    <p className="text-sm text-red-500 mb-2">
                        데이터를 불러오는데 실패했습니다.
                    </p>
                    <p className="text-xs text-gray-500">{error}</p>
                </div>
            ) : itemsToRender && itemsToRender.length > 0 ? (
                <div className="space-y-3">
                    {itemsToRender.map((item) => (
                        <div
                            key={item.furniture_id}
                            onClick={() => {
                                handleSaveFurniture(item);
                                !isSelectedCategory 
                                    ? handleItemClick(item) 
                                    : handleSelectModel && handleSelectModel(item);
                            }}
                            className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all overflow-hidden cursor-pointer"
                        >
                            <div className="flex">
                                {/* 이미지 영역 */}
                                <div className={`${isSelectedCategory ? 'w-24 h-24' : 'w-20 h-20'} bg-gray-100 flex-shrink-0`}>
                                    {item.image_url && !imageErrors.has(item.id) ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            onError={() => handleImageError(item.id)}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageOff className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* 정보 영역 */}
                                <div className={`flex-1 ${isSelectedCategory ? 'p-4' : 'p-3'}`}>
                                    {/* 이름 */}
                                    <h4 className="text-sm font-medium text-gray-800 line-clamp-1 mb-1">
                                        {item.name}
                                    </h4>

                                    {/* 브랜드 */}
                                    {item.brand && (
                                        <p className="text-xs text-gray-500 line-clamp-1 mb-1">
                                            {item.brand}
                                        </p>
                                    )}

                                    {/* 치수 정보 */}
                                    {(item.length_x && item.length_y && item.length_z) && (
                                        <p className="text-xs text-gray-500 mb-1">
                                            {item.length_x}×{item.length_y}×{item.length_z}mm
                                        </p>
                                    )}

                                    {/* 가격 정보 */}
                                    {item.price && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-semibold text-gray-700">
                                                ₩{Number(item.price).toLocaleString()}
                                            </span>
                                            {/* 가구 카운트 */}
                                            {selectedCategory === "-1" && (
                                                <span className="text-xs font-semibold text-gray-700 mr-8">
                                                {Number(item.count).toLocaleString()}
                                            </span>
                                            )}
                                        </div>
                                    )}

                                    {/* 배치한 가구 목록에서만 쇼핑 링크 표시 */}
                                    {isSelectedCategory && (
                                        <div className="flex justify-end mt-2">
                                            <ShoppingLink 
                                                furnitureName={item.name}
                                                className="text-xs"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-sm text-gray-500">
                        {selectedCategory && selectedCategory !== '전체'
                            ? '선택한 카테고리에 가구가 없습니다.'
                            : '표시할 가구가 없습니다.'}
                    </p>
                </div>
            )}
        </div>
    </>
}

export default ItemSection;