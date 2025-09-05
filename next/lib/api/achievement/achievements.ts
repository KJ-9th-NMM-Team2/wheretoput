import { prisma } from "@/lib/prisma";
import { Achievement } from "@/lib/achievements";

export async function createAchievementsData(datas: Achievement[]) {
  const result = await prisma.achievements.createMany({
    data: datas,
  });
  return result;
}

export async function getAllAchievementsDatas() {
  return await prisma.achievements.findMany({});
}

export async function getUserAchievements(userId: string) {
  return await prisma.user_achievements.findMany({
    where: {
      user_id: userId
    }
  });
}

export async function getUserAchievementsWithStatus(userId: string) {
  const allAchievements = await getAllAchievementsDatas();
  const userAchievements = await getUserAchievements(userId);
  
  const unlockedMap = new Map();
  userAchievements.forEach(ua => {
    unlockedMap.set(ua.achievement_id, ua.unlocked_at);
  });
  
  return allAchievements.map(achievement => ({
    ...achievement,
    unlocked: unlockedMap.has(achievement.id),
    unlocked_at: unlockedMap.get(achievement.id) || null
  }));
}

export async function getUserAchievementsData(userId: string) {
  return await getUserAchievementsWithStatus(userId);
}