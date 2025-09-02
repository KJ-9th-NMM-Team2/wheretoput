import { prisma } from "@/lib/prisma";

export async function searchFurnitures(
  query: string,
  selectedCategory: string
) {
  try {
    const decodeString = decodeURIComponent(query);

    if (!decodeString.trimStart() && !decodeString.trimEnd()) {
      return [];
    }

    // 카테고리 ID 검증
    const categoryId = parseInt(selectedCategory);
    if (isNaN(categoryId)) {
      throw new Error("유효하지 않은 카테고리 ID입니다");
    }

    const furnitures = await prisma.furnitures.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: decodeString, mode: "insensitive" } },
              { brand: { contains: decodeString, mode: "insensitive" } },
            ],
          },
          { category_id: categoryId },
        ],
      },
      distinct: ["furniture_id"], // 중복 제거
      orderBy: [{ updated_at: "desc" }],
    });

    return Response.json(furnitures);
  } catch (error) {
    console.error("Error Search Furnitures:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
