import { useEffect } from "react";
import { useFetchItems } from "./useFetchItems";
import { useFetchItemsType, useHandleCategoryChangeType } from "@/types/sideItems";

export const useHandleCategoryChange = (
    items: useFetchItemsType, {
    page, selectedCategory, sortOption,
    setSelectedItems, setTotalPrice, setPage
}: useHandleCategoryChangeType) => {

    // API에서 데이터 가져오기 함수
    const fetchItems = useFetchItems(items);

    // 페이지나 카테고리 변경 시 데이터 가져오기
    useEffect(() => {
    const handleCategoryChange = async () => {
        fetchItems(page, selectedCategory, sortOption);
        setSelectedItems([]);
        setTotalPrice(0);
    };
    handleCategoryChange();
    }, [page, selectedCategory, sortOption, fetchItems]);

    // 카테고리나 정렬 변경 시 첫 페이지로 리셋
    useEffect(() => {
    setPage(1);
    }, [selectedCategory, sortOption]);
}