"use client"
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export function ArchievementToast() {
    const {data: session} = useSession();
    const [achievementToast, setAchievementToast] = useState(null);

    // 업적 토스트 표시 함수
    const showAchievementToast = (achievement: any) => {
        setAchievementToast(achievement);
        setTimeout(() => {
            console.log("🔫 토스트 숨기기:", achievement.title);
            setAchievementToast(null);
        }, 2000); // 2초 표시
    };

    useEffect(() => {
        // 상대 경로 사용: 현재 origin에서 /api/achievement/sse 호출
        const eventSource = new EventSource(`/api/achievement/sse?userId=${session?.user?.id}`); 
        
        eventSource.onopen = () => {
            console.log('SSE 연결됨');
        };

        eventSource.onmessage = (e) => {
            const datas = JSON.parse(e.data);
            console.log("🔫 업적 토스트 수신:", datas);
            
            if (datas.type === 'achievements_unlocked') {
                const achievements = datas.achievements;

                for (let i=0; i<achievements.length; i++) {
                    setTimeout(() => {
                        console.log(`🔫 ${i}번째 토스트 표시:`, achievements[i].title);
                        showAchievementToast(achievements[i]);
                    }, i * 3500); // 0초, 3.5초, 7초
                }
            }
        }

        eventSource.onerror = (error) => {
            console.log('SSE 연결 오류:', error);
        }

        // cleanup 함수로 연결 정리
        return () => {
            console.log('SSE 연결 정리 중...');
            eventSource.close();
        };
    }, [session?.user?.id])

    return <>
        {/* 업적 토스트 */}
        {achievementToast && (
            <div className="fixed top-25 left-1/2 transform -translate-x-1/2 z-[200] max-w-sm">
                <div className="bg-orange-500/80 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl border border-white/20">
                    <div className="flex items-center gap-3 text-white">
                        <div className="text-2xl drop-shadow-lg">{achievementToast.icon || '🏆'}</div>
                        <div>
                            <div className="font-bold text-sm drop-shadow-sm">새로운 업적 달성!</div>
                            <div className="font-semibold drop-shadow-sm">{achievementToast.title}</div>
                            <div className="text-xs opacity-90 drop-shadow-sm">{achievementToast.description}</div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
}