import { checkAchievement } from "@/lib/api/achievement/checkAchievement";
import { sendSSEToUser } from "@/lib/api/achievement/utils/sse";
import { NextRequest } from "next/server";
import { getFurniture } from "@/lib/api/furniture/getFurnitures";
import { checkUserOwnRoom } from "@/lib/api/achievement/checkUserOwnRoom";

export async function POST(request: NextRequest) {
    try {
        const { userId, roomId, newFurniture } = await request.json();
        let isFurniture = false;

        const result = await checkUserOwnRoom(roomId, userId);
        if (!result) {
            return Response.json("유저의 방이 아니기 떄문에 업적 달성이 불가능합니다.", {status: 403});
        }
        
        const furnitures = await getFurniture(roomId);
        const newFurnitures = [...furnitures, newFurniture];
        // 방이 존재하고 가구가 성공적으로 추가되었는지 확인
        if (roomId && newFurnitures.length > 0) {
            isFurniture = true;
            }
        
        if (newFurnitures) {
            const achievementResult = await checkAchievement(userId, isFurniture);
            if (!achievementResult) {
                return new Response("Can not find achievements at all", {status: 404});
            }
            
            // 새로 달성한 업적이 있으면 SSE로 알림
            const newlyUnlocked = achievementResult['newlyUnlocked'];
            
            // 한 번에 모든 업적을 전송
            sendSSEToUser(userId, {
                type: 'achievements_unlocked', // 복수형으로 변경
                achievements: newlyUnlocked
            });
                
            return Response.json(achievementResult);
        }

        return Response.json("Can not save furniture", {status: 404});
    } catch (error) {
        console.log("Error in next/app/sim/furnitures/click :", error);
        return Response.json("Internal Server Error", {status: 500});
    }
}