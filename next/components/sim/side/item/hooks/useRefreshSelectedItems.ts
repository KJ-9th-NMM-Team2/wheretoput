import { fetchSelectedFurnitures } from "@/lib/api/furniture/fetchSelectedFurnitures";
import { useRefreshSelectedItemsType } from "@/types/sideItems";
import { useEffect } from "react";

export const useRefreshSelectedItems = async ({
    loadedModels,
    selectedCategory,
    roomId,
    sortOption,
    setSelectedItems,
    setTotalPrice,
}: useRefreshSelectedItemsType) => {

    useEffect(() => {
        const refreshSelectedItems = async () => {
            if (selectedCategory === "-1") {
            const furnitureId = loadedModels.map((item: any) => item.furniture_id);
            const result = await fetchSelectedFurnitures(
                furnitureId,
                roomId,
                sortOption
            );

            if (result) {
                setSelectedItems(result.furnitures);
                setTotalPrice(result.totalPrice);
            }
            }
        };
        refreshSelectedItems();
    }, [loadedModels, selectedCategory, sortOption, setTotalPrice]);
}