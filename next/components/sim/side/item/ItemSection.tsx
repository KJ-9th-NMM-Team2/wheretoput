import { ImageOff, Loader2, Minus, Plus } from 'lucide-react';
import type { ItemScrollProps } from '@/lib/types';

const ItemSection: React.FC<ItemScrollProps> = ({
    loading,
    error,
    filteredItems,
    imageErrors,
    selectedCategory,
    handleItemClick,
    handleImageError,
}) => {

    return (
        <>
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
            ) : filteredItems.length > 0 ? (
                <div className="space-y-3">
                    {filteredItems.map((item) => (
                        <div
                            key={item.furniture_id}
                            className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all overflow-hidden"
                        >
                            <div className="flex">
                                {/* 이미지 영역 */}
                                <div className="w-20 h-20 bg-gray-100 flex-shrink-0">
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
                                <div className="flex-1 p-3 flex flex-col">
                                    <div className="flex items-start justify-between mb-1">
                                        <h4 className="text-sm font-medium text-gray-800 line-clamp-1">
                                            {item.name}
                                        </h4>
                                        {item.brand && (
                                            <span className="text-xs text-gray-500 ml-2">
                                                {item.brand}
                                            </span>
                                        )}
                                    </div>

                                    {/* 가격과 사이즈 정보 */}
                                    <div className="flex items-center justify-between text-xs">
                                        {item.price && (
                                            <span className="font-semibold text-gray-700">
                                                ₩{Number(item.price).toLocaleString()}
                                            </span>
                                        )}
                                        {(item.length_x && item.length_y && item.length_z) && (
                                            <span className="text-gray-500">
                                                {item.length_x}×{item.length_y}×{item.length_z}cm
                                            </span>
                                        )}
                                    </div>
                                    {/* 카운터 - 우측 하단 */}
                                    <div className="flex justify-end mt-auto">
                                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-300 rounded-md px-1 py-0.5">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleItemClick(item, -1);
                                                }}
                                                disabled={(item.count || 0) === 0}
                                                className={`w-5 h-5 flex items-center justify-center text-xs ${
                                                    (item.count || 0) === 0 
                                                        ? 'text-gray-400 cursor-not-allowed' 
                                                        : 'text-gray-600 hover:text-red-600'
                                                }`}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            
                                            <span className="text-xs font-medium min-w-[12px] text-center">
                                                {item.count || 0}
                                            </span>
                                            
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleItemClick(item, 1);
                                                }}
                                                disabled={(item.count || 0) >= 10}
                                                className={`w-5 h-5 flex items-center justify-center text-xs ${
                                                    (item.count || 0) >= 10 
                                                        ? 'text-gray-400 cursor-not-allowed' 
                                                        : 'text-gray-600 hover:text-blue-600'
                                                }`}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
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
    );
}

export default ItemSection;