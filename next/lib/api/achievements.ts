import { prisma } from "@/lib/prisma";
import { getUserAchievements, UserStats } from "@/lib/achievements";

export async function getUserStats(userId: string): Promise<UserStats> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      rooms: {
        include: {
          room_likes: true,
          room_objects: {
            include: {
              furnitures: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  const totalBudget = user.rooms.reduce((sum: number, room: any) => {
    return sum + room.room_objects.reduce((roomSum: number, obj: any) => {
      return roomSum + (obj.furnitures?.price || 0);
    }, 0);
  }, 0);

  const totalFurniture = user.rooms.reduce((sum: number, room: any) => sum + room.room_objects.length, 0);

  console.log('totalFurniture', totalFurniture);
  const stats: UserStats = {
    roomCount: user.rooms.length,
    furnitureCount: totalFurniture,
    totalLikes: user.rooms.reduce((sum: number, room: any) => sum + room.room_likes.length, 0),
    totalViews: user.rooms.reduce((sum: number, room: any) => sum + (room.view_count || 0), 0),
    playTimeHours: 0,
    furnitureMovements: 0,
    budget: totalBudget,
    minimalRooms: totalFurniture > 3 ? 0 : 1,
    colorUnifiedRooms: 0,
    modifications: 0,
    catFurniture: 0,
    plants: 0,
    beds: 0,
    continuousPlayHours: 0,
    singleFurnitureMovements: 0
  };

  return stats;
}

export async function getUserAchievementsData(userId: string) {
  const stats = await getUserStats(userId);
  return getUserAchievements(stats);
}