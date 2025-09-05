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
    id: string;
    title: string;
    description: string;
    icon: string;
    category: 'beginner' | 'intermediate' | 'advanced' | 'special' | 'hidden';
    condition: (stats: UserStats) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
    // 초보자 단계
    {
        id: 'first_furniture',
        title: '첫 삽질',
        description: '첫 번째 가구를 배치하다 (누구나 시작은 어색하죠)',
        icon: '🪑',
        category: 'beginner',
        condition: (stats) => stats.furnitureCount >= 1
    },
    {
        id: 'tetris_master',
        title: '테트리스 마스터',
        description: '가구 10개를 완벽하게 배치하다 (블록 맞추기의 달인)',
        icon: '🧩',
        category: 'beginner',
        condition: (stats) => stats.furnitureCount >= 10
    },
    {
        id: 'minimalist_pretender',
        title: '미니멀리스트인 척',
        description: '방에 가구 3개 이하로만 배치하기 (사실 귀찮았던 거 아닌가요?)',
        icon: '✨',
        category: 'beginner',
        condition: (stats) => stats.minimalRooms >= 1
    },

    // 중급자 업적
    {
        id: 'ikea_pilgrim',
        title: '이케아 순례자',
        description: '조립식 가구 50개 설치하기 (육각렌치는 어디 갔을까요)',
        icon: '🔧',
        category: 'intermediate',
        condition: (stats) => stats.furnitureCount >= 50
    },
    {
        id: 'space_magician',
        title: '공간의 마법사',
        description: '좁은 방에 가구 20개 이상 배치하기 (물리법칙 무시하기)',
        icon: '🪄',
        category: 'intermediate',
        condition: (stats) => stats.furnitureCount >= 20
    },
    {
        id: 'color_obsessive',
        title: '색깔 강박증',
        description: '모든 가구를 같은 색으로 통일하기 (완벽주의의 시작)',
        icon: '🎨',
        category: 'intermediate',
        condition: (stats) => stats.colorUnifiedRooms >= 1
    },

    // 고급자 업적
    {
        id: 'interior_dictator',
        title: '인테리어 독재자',
        description: '가구 배치를 100번 수정하기 (완벽할 때까지!)',
        icon: '👑',
        category: 'advanced',
        condition: (stats) => stats.modifications >= 100
    },
    {
        id: 'feng_shui_master',
        title: '풍수지리 마스터',
        description: '모든 가구를 풍수에 맞게 배치하기 (기운이 느껴지시나요?)',
        icon: '☯️',
        category: 'advanced',
        condition: (stats) => stats.roomCount >= 5 && stats.furnitureCount >= 50
    },
    {
        id: 'budget_destroyer',
        title: '예산 파괴자',
        description: '가상 예산 100만원 초과하기 (현실은 더 무섭죠)',
        icon: '💸',
        category: 'advanced',
        condition: (stats) => stats.budget >= 1000000
    },

    // 특수 업적
    {
        id: 'cat_butler',
        title: '고양이 집사',
        description: '캣타워와 스크래처 10개 이상 배치 (누가 주인인지 헷갈려요)',
        icon: '🐱',
        category: 'special',
        condition: (stats) => stats.catFurniture >= 10
    },
    {
        id: 'plant_killer',
        title: '식물 킬러',
        description: '화분 50개 배치 후 모두 제거하기 (현실에서도 그러시죠?)',
        icon: '🪴',
        category: 'special',
        condition: (stats) => stats.plants >= 50
    },
    {
        id: 'bed_collector',
        title: '침대 수집가',
        description: '한 방에 침대 5개 이상 배치하기 (호텔인가요?)',
        icon: '🛏️',
        category: 'special',
        condition: (stats) => stats.beds >= 5
    },

    // 히든 업적
    {
        id: 'time_thief',
        title: '시간 도둑',
        description: '연속 3시간 플레이하기 (어 벌써 이런 시간?)',
        icon: '⏰',
        category: 'hidden',
        condition: (stats) => stats.continuousPlayHours >= 3
    },
    {
        id: 'perfectionist_curse',
        title: '완벽주의의 저주',
        description: '같은 가구를 50번 이상 옮기기 (1cm만 더...)',
        icon: '🔄',
        category: 'hidden',
        condition: (stats) => stats.singleFurnitureMovements >= 50
    },
    {
        id: 'reality_escape',
        title: '현실 도피',
        description: '가상에서만 꿈의 방 완성하기 (현실은... 음...)',
        icon: '🏠',
        category: 'hidden',
        condition: (stats) => stats.roomCount >= 1 && stats.playTimeHours >= 10
    }
];

export function getUserAchievements(stats: UserStats) {
    return ACHIEVEMENTS.map(achievement => ({
        ...achievement,
        unlocked: achievement.condition(stats)
    }));
}