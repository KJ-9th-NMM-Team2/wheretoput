export interface UserStats {
  roomCount: number;
  furnitureCount: number;
  totalLikes: number;
  totalViews: number;
  playTimeHours: number;
  furnitureMovements: number;
  budget: number;
  minimalRooms: number;
  colorUnifiedRooms: number;
  modifications: number;
  catFurniture: number;
  plants: number;
  beds: number;
  continuousPlayHours: number;
  singleFurnitureMovements: number;
}

export interface Achievement {
  title: string;
  description: string;
  icon: string;
  category: '초보자' | '중급자' | '고급자' | '특수' | '히든';
}

// export function getUserAchievements() {
//   return ACHIEVEMENTS.map(achievement => ({
//     ...achievement,
//   }));
// }