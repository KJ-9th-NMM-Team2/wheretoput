// event 발생 for SSE
export const useSaveFurniture = async (furniture: any, roomId: string, userId: string, setAchievements: any) => {
    try {
        const response = await fetch('/api/sim/furnitures/click', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                roomId,
                newFurniture: furniture
            })
        });

        if (response.ok) {
            const achievementResult = await response.json();
            setAchievements(achievementResult.newlyUnlocked);
        }
    } catch (error) {
        console.error('업적 처리 에러:', error);
    }
}