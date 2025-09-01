interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  skip: number;
}

export function calculatePagination(page: number = 1, limit: number = 5, totalCount: number): PaginationInfo {
  const skip = (page - 1) * limit;
  return {
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    totalItems: totalCount,
    itemsPerPage: limit,
    hasNext: page * limit < totalCount,
    hasPrev: page > 1,
    skip,
  };
}