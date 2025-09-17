import { fetchFurnitures } from "@/lib/api/furniture/fetchFurnitures";
import { useFetchItemsType } from "@/types/sideItems";
import { useCallback } from "react";

export const useFetchItems = ({
    loading,
    query,
    itemsPerPage,
    setTotalPages,
    setTotalItems,
    setLoading,
    setError,
    setItems,
}: useFetchItemsType) => {
    const fetchItems = useCallback(
        async (page: number, category: string | null, sort: string) => {
            if (loading) return; // 이미 호출 중이면 리턴
            fetchFurnitures({
                setTotalPages,
                setTotalItems,
                setLoading,
                setError,
                setItems,
                query,
                page,
                itemsPerPage,
                category: category || null || "",
                sort: sort,
            });
        },
        [itemsPerPage, query]
    );
    return fetchItems;
}