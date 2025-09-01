import { furnitures as Furniture } from "@prisma/client";

interface fetchFurnituresProps {
  setTotalPages: (totalPage: number) => void;
  setTotalItems: (itemCount: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setItems: (items: Furniture[]) => void;
  page: number;
  itemsPerPage: number;
  category: string;
}

export async function fetchFurnitures({
  setTotalPages,
  setTotalItems,
  setLoading,
  setError,
  setItems,
  page,
  itemsPerPage,
  category
}: fetchFurnituresProps) {
    try {
        setLoading(true);
        setError(null);

        // URL 파라미터 구성
        const params = new URLSearchParams({
            page: page.toString(),
            limit: itemsPerPage.toString(),
        });

        // 카테고리가 선택되었다면 파라미터에 추가
        if (category) {
            params.append('category', category);
        }

        const response = await fetch(`/api/sim/furnitures?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        // 개선된 API 응답 구조 처리
        if (data.items && data.pagination) {
            // 새로운 API 응답 형식
            setItems(data.items);
            setTotalItems(data.pagination.totalItems);
            setTotalPages(data.pagination.totalPages);
        }
        console.log(`data check : ${data}`);

    } catch (err) {
        console.error('Failed to fetch items:', err);
        setError(err instanceof Error ? err.message : 'Failed to load items');
        setItems([]);
        setTotalPages(0);
    } finally {
        setLoading(false);
    }
}