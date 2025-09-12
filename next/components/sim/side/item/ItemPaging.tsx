import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ItemPagingProps } from '@/lib/itemTypes';

const ItemPaging: React.FC<ItemPagingProps> = ({ 
    loading, 
    error, 
    currentPage, 
    totalPages, 
    totalItems,
    handlePrevPage, 
    handleNextPage, 
    itemsPerPage,
}) => {
    // 페이지네이션을 표시하지 않는 조건
    if (loading || error || totalItems <= itemsPerPage) {
        return null;
    }

    return (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
                <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className={`p-1 rounded transition-colors ${
                        currentPage === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-200 cursor-pointer'
                    }`}
                    aria-label="이전 페이지"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <span className="text-sm text-gray-600">
                    {currentPage} / {totalPages}
                </span>

                <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`p-1 rounded transition-colors ${
                        currentPage === totalPages
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-200 cursor-pointer'
                    }`}
                    aria-label="다음 페이지"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default ItemPaging;