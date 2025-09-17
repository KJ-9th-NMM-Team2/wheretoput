import { useHandlePageType } from "@/types/sideItems";
import { handlePageChange } from "@/utils/handlePage";
import { useCallback } from "react";

// 페이지 변경 핸들러들
export const useHandlePage = ({
    page, totalPages, setPage, option
}: useHandlePageType) => {
    const handleNextPage = useCallback(() => {
        if (totalPages !== undefined) {
            handlePageChange(page, setPage, option, totalPages);
        } else {
            handlePageChange(page, setPage, option);
        }
        
    }, [page, totalPages]);

    return handleNextPage;
}

//   const handlePrevPage = useCallback(() => {
//     handlePageChange(page, setPage, "prev");
//   }, [page]);

//   const handleNextPage = useCallback(() => {
//     handlePageChange(page, setPage, "next", totalPages);
//   }, [page, totalPages]);