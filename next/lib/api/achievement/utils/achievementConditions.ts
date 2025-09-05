// title로 매핑하는 방법 (더 유지보수하기 쉬움)
export const getConditionByTitle = () => {
    return {
        '첫 삽질': (history: any) => history.totalFurniture >= 1,
        '테트리스 마스터': (history: any) => history.totalFurniture >= 10,
        '미니멀리스트인 척': (history: any) => history.totalRooms >= 1 && history.totalFurniture > 0 && history.totalFurniture <= 3,
        '이케아 순례자': (history: any) => history.totalFurniture >= 50,
        '공간의 마법사': (history: any) => history.totalFurniture >= 20,
        '색깔 강박증': (history: any) => history.totalRooms >= 1,
        '인테리어 독재자': (history: any) => history.totalFurniture >= 100,
        '풍수지리 마스터': (history: any) => history.totalRooms >= 5 && history.totalFurniture >= 50,
        '예산 파괴자': (history: any) => history.totalFurniture >= 1000,
        '고양이 집사': (history: any) => history.totalFurniture >= 10,
        '식물 킬러': (history: any) => history.totalFurniture >= 50,
        '침대 수집가': (history: any) => history.totalFurniture >= 5,
        '시간 도둑': (history: any) => history.totalRooms >= 1,
        '완벽주의의 저주': (history: any) => history.totalFurniture >= 50,
        '현실 도피': (history: any) => history.totalRooms >= 1
    };
};