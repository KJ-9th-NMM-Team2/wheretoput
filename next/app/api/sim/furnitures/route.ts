import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const skip = (page - 1) * limit;

    const furnitures = await prisma.furnitures.findMany({
        skip,
        take: limit,
    });

    return Response.json(furnitures);
}