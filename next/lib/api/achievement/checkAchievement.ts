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
    
    // 총 가구 개수
    const totalFurniture = user.rooms.reduce((sum, room) => sum + room._count.room_objects, 0);
    const totalWalls = user.rooms.reduce((sum, room) => sum + room._count.room_walls, 0);
    const totalComments = user._count.room_comments;
    const totalLikes = user._count.room_likes;
    console.log(`유저의 총 댓글 수: ${user._count.room_comments}개`);
    console.log(`유저의 좋아요 수: ${user._count.room_likes}개`);
    console.log(`총 벽 개수: ${totalWalls}개`);
    console.log(`총 가구 개수: ${totalFurniture}개`);
    console.log(`총 벽 개수: ${totalWalls}개`);
    
    return {
        totalRooms: user.rooms.length,
        totalFurniture,
        totalWalls,
        totalComments,
        totalLikes,
    };
}

export async function checkAchievement(userId: string, isFurniture: boolean) {
    const userHistory = await countUserHistory(userId);
    if (!userHistory) {
        return { error: 'User not found' };
    }

    if (isFurniture) {
        userHistory.totalFurniture += 1;
    } else {
        userHistory.totalRooms += 1;
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
        const titleConditions = getConditionByTitle();
        const conditionFn = titleConditions[achievement.title];
        console.log('conditionFn', conditionFn);
        
        if (conditionFn && conditionFn(userHistory)) {
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
        unlockedCount: userAchievements.length + newlyUnlocked.length,
        icons: newlyUnlocked.map(a => a.icon)
    };
}