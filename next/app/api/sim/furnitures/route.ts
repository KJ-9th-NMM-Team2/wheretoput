import { prisma } from "@/lib/prisma";
import type { Furniture } from '@prisma/client'; // 타입 import 추가

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        console.log("Search params:", searchParams.toString());
        
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '5');
        const category = parseInt(searchParams.get('category') || '1'); // 문자열로 받아서 나중에 변환
        const skip = (page - 1) * limit;
        
        console.log(`Fetching page ${page}, limit ${limit}, category: ${category}`);

        // 변수를 try 블록 밖에서 선언
        let furnitures: Furniture[] = [];
        let totalCount: number = 0;

        try {
            // 카테고리가 지정된 경우
            console.log("카테고리 필터링:", category);
            
            [furnitures, totalCount] = await Promise.all([
                prisma.furnitures.findMany({
                    where: {
                        category_id: category
                    },
                    take: limit,
                    skip: skip,
                    orderBy: {
                        furniture_id: 'asc'
                    }
                }),
                prisma.furnitures.count({
                    where: {
                        category_id: category
                    }
                })
            ]);
            
            console.log(`조회 성공: ${furnitures.length}개 조회, 전체 ${totalCount}개`);
            
        } catch (dbError) {
            console.error("데이터베이스 쿼리 실패:", dbError);
            throw dbError; // 상위로 에러 전파
        }

        // 응답 데이터 구성
        const response = {
            items: furnitures,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: limit,
                hasNext: page * limit < totalCount,
                hasPrev: page > 1
            },
            debug: {
                searchParams: searchParams.toString(),
                appliedCategory: category,
                skip,
                limit,
                resultCount: furnitures.length
            }
        };

        return Response.json(response);

    } catch (error) {
        console.error('API Error:', error);
        return Response.json(
            { 
                error: 'Internal Server Error', 
                message: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : 'Server error occurred'
            },
            { status: 500 }
        );
    }
}