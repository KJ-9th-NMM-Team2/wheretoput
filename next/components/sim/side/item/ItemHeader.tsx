import { Loader2 } from "lucide-react";
import type { Furniture } from '@prisma/client';

interface ItemHeaderProps {
    loading: boolean,
    filteredItems: Furniture[],
}

const ItemHeader: React.FC<ItemHeaderProps> = ({ loading, filteredItems }) => {
    {/* 아이템 목록 헤더 */ }
    return <>
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">
                    가구 목록
                </h3>
                <span className="text-xs text-gray-500">
                    {loading ? (
                        <span className="flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            로딩 중...
                        </span>
                    ) : (
                        `총 ${filteredItems.length}개`
                    )}
                </span>
            </div>
        </div>
    </>
}

export default ItemHeader;