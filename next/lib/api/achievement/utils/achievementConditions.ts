// title로 매핑하는 방법 (더 유지보수하기 쉬움)
export const getConditionByTitle = () => {
    return {
        '첫 방 생성': (history: any) => history.totalRooms >= 1,
        '첫 가구 배치': (history: any) => history.totalFurniture >= 1,
        '가구 10개': (history: any) => history.totalFurniture >= 10,
        '가구 30개': (history: any) => history.totalFurniture >= 30,
    };
};