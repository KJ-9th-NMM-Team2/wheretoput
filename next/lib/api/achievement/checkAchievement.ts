import { prisma } from "@/lib/prisma";
import { getConditionByTitle } from "./utils/achievementConditions";

async function countUserHistory(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            _count: {
                select: {
                    room_comments: true,
                    room_likes: true
                }
            },
            rooms: {
                include: {
                    _count: {
                        select: {
                            room_objects: true,
                            room_walls: true
                        }
                    }
                }
            }
        },
    });
    
    if (!user) {
        console.log('User not found');
        return;
    }
    
    // console.log(`사용자: ${user.name}`);
    // console.log(`총 방 개수: ${user.rooms.length}`);
    
    // 각 방별 가구와 벽 개수
    // user.rooms.forEach((room, index) => {
    //     console.log(`방 ${index + 1}: ${room.title}`);
    //     console.log(`  - 가구 개수: ${room._count.room_objects}개`);
    //     console.log(`  - 벽 개수: ${room._count.room_walls}개`);
    // });
    
    // 총 가구 개수
    const totalFurniture = user.rooms.reduce((sum, room) => sum + room._count.room_objects, 0);
    const totalWalls = user.rooms.reduce((sum, room) => sum + room._count.room_walls, 0);
    const totalComments = user._count.room_comments;
    const totalLikes = user._count.room_likes;
    // console.log(`유저의 총 댓글 수: ${user._count.room_comments}개`);
    // console.log(`유저의 좋아요 수: ${user._count.room_likes}개`);
    // console.log(`총 벽 개수: ${totalWalls}개`);
    // console.log(`총 가구 개수: ${totalFurniture}개`);
    // console.log(`총 벽 개수: ${totalWalls}개`);
    
    return {
        totalRooms: user.rooms.length,
        totalFurniture,
        totalWalls,
        totalComments,
        totalLikes,
        // roomDetails: user.rooms.map(room => ({
        //     roomId: room.room_id,
        //     title: room.title,
        //     furnitureCount: room._count.room_objects,
        //     wallCount: room._count.room_walls
        // }))
    };
}

export async function checkAchievement(userId: string) {
    const userHistory = await countUserHistory(userId);
    
    if (!userHistory) {
        return { error: 'User not found' };
    }
    
    // DB에서 모든 업적 가져오기
    const allAchievements = await prisma.achievements.findMany({});
    
    // 사용자가 이미 달성한 업적들 가져오기
    const userAchievements = await prisma.user_achievements.findMany({
        where: { user_id: userId }
    });
    
    const unlockedAchievementIds = new Set(userAchievements.map(ua => ua.achievement_id));
    
    // 새로 달성한 업적들 찾기
    const newlyUnlocked = [];
    
    for (const achievement of allAchievements) {
        // 이미 달성한 업적은 건너뛰기
        if (unlockedAchievementIds.has(achievement.id)) {
            continue;
        }
        
        // 조건 체크
        const conditionFn = getConditionByTitle(achievement.title);
        if (conditionFn) {
            newlyUnlocked.push(achievement);
            
            // DB에 새 업적 추가
            await prisma.user_achievements.create({
                data: {
                    user_id: userId,
                    achievement_id: achievement.id,
                }
            });
        }
    }
    
    console.log(`새로 달성한 업적: ${newlyUnlocked.length}개`);
    newlyUnlocked.forEach(achievement => {
        console.log(`🏆 ${achievement.title} - ${achievement.description}`);
    });
    
    return {
        userHistory,
        newlyUnlocked,
        totalAchievements: allAchievements.length,
        unlockedCount: userAchievements.length + newlyUnlocked.length
    };
}