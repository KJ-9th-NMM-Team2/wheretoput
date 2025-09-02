// 선택되어 있는 아이템들 가져오는 함수
export async function fetchSelectedFurnitures(furnitureIds: string[]) {
    try {
        const idsParams = furnitureIds.join(',');
    const response = await fetch(`/api/furnitures/selected?idsParams=${idsParams}`);
        if (!response) {
            throw new Response("Fetch ERROR", { status: 400});
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetch Furnitures:", error);
        return new Response("Internal Server Error", { status: 500})
    }
}