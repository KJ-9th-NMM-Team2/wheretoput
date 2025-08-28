import { prisma } from '@/lib/prisma';

// 별도의 카테고리 목록을 가져오는 API 엔드포인트
// app/api/sim/categories/route.ts 에 생성
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const id = parseInt(searchParams.get('id') || '1');

        const whereCondition: any = {
            category_id: id
        }

        const categories = await prisma.categories.findMany({
            where: {
                where: whereCondition,
                // is_active가 true인 카테고리만 (필요한 경우)
                // is_active: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        return Response.json({
            categories
        });

    } catch (error) {
        console.error('Categories API Error:', error);
        return Response.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}