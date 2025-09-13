import { checkAchievement } from "@/lib/api/achievement/checkAchievement";
import { sendSSEToUser } from "@/lib/api/achievement/utils/sse";
import { NextRequest } from "next/server";
import { getFurniture } from "@/lib/api/furniture/getFurnitures";
import { checkUserOwnRoom } from "@/lib/api/achievement/checkUserOwnRoom";


/**
 * @swagger
 * /api/sim/furnitures/click:
 *   post:
 *     tags:
 *       - Furniture
 *     summary: 방에 가구 추가 및 업적 달성 확인
 *     description: 
 *       사용자가 자신의 방에 새 가구를 추가할 때 업적 달성을 확인하고, 
 *       새로 달성된 업적이 있다면 SSE 이벤트로 알림을 전송합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - roomId
 *               - newFurniture
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 가구를 추가하는 사용자 ID
 *                 example: "user_123"
 *               roomId:
 *                 type: string
 *                 description: 가구를 추가할 방 ID
 *                 example: "room_456"
 *               newFurniture:
 *                 type: object
 *                 description: 새로 추가할 가구 정보
 *                 example: 
 *                   id: "furn_789"
 *                   name: "Wooden Chair"
 *                   type: "chair"
 *     responses:
 *       200:
 *         description: 가구 추가 및 업적 확인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 newlyUnlocked:
 *                   type: array
 *                   description: 새로 달성한 업적 목록
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "achv_001"
 *                       name:
 *                         type: string
 *                         example: "첫 번째 가구 배치"
 *                 allAchievements:
 *                   type: array
 *                   description: 사용자가 현재까지 달성한 모든 업적
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "achv_002"
 *                       name:
 *                         type: string
 *                         example: "방 꾸미기 마스터"
 *       403:
 *         description: 유저가 해당 방의 소유자가 아님 (업적 달성 불가)
 *       404:
 *         description: 업적 데이터를 찾을 수 없음 또는 가구 저장 실패
 *       500:
 *         description: 서버 내부 오류
 */
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
            },  1 // 초기 연결 시도 횟수는 1로 시작
            );
                
            return Response.json(achievementResult);
        }

        return Response.json("Can not save furniture", {status: 404});
    } catch (error) {
        console.log("Error in next/app/sim/furnitures/click :", error);
        return Response.json("Internal Server Error", {status: 500});
    }
}