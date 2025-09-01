export const handlePageChange = (
    currentPage: number, 
    setCurrentPage: (page: number) => void, 
    direction: 'prev' | 'next',
    totalPages?: number
) => {
    if (direction === 'prev' && currentPage > 1) {
        setCurrentPage(currentPage - 1);
    } else if (direction === 'next' && totalPages && currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
    }
};