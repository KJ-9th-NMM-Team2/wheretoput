import { furnitures as Furniture } from "@prisma/client";

export interface useFetchItemsType {
    loading: boolean;
    query: string;
    itemsPerPage: number;
    setTotalPages: (totalPages: number) => void;
    setTotalItems: (totalItesm: number) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setItems: (furnitures: Furniture[]) => void;
}

export interface useHandleCategoryChangeType {
    page: number;
    selectedCategory: string | null;
    sortOption: string;
    setSelectedItems: (items: Furniture[]) => void;
    setTotalPrice: (totalPrice: number) => void;
    setPage: (page: number) => void;
}

export interface useRefreshSelectedItemsType {
    loadedModels: any[];
    selectedCategory: string | null;
    roomId: string;
    sortOption: string;
    setSelectedItems: (selectedItems: Furniture[]) => void;
    setTotalPrice: (totalPrice: number) => void;
}

export interface useHandlePageType {
    page: number;
    totalPages?: number;
    setPage: (page: number) => void;
    option: "prev" | "next";
}

export interface useHandleSelectModelType {
    loadedModels: any[];
    selectModel: any;
}