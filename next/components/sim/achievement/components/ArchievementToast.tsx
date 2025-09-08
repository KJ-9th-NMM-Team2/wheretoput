"use client"
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useStore } from "../../useStore";

export function ArchievementToast() {
    const {data: session} = useSession();
    const [achievementToast, setAchievementToast] = useState(null);
    const { achievements } = useStore();

    // 업적 토스트 표시 함수
    const showAchievementToast = (achievement: any) => {
        setAchievementToast(achievement);
        setTimeout(() => {
            console.log("🔫 토스트 숨기기:", achievement.title);
            setAchievementToast(null);
        }, 2000); // 2초 표시
    };

    // SSE 연결 및 실시간 업적 알림 수신
    useEffect(() => {
        // session이 로드될 때까지 기다리기
        const checkSession = () => {
            
            if (!session?.user?.id) {
                setTimeout(checkSession, 1000);
                return;
            }

            for (let i=0; i<achievements.length; i++) {
                setTimeout(() => {
                    console.log(`🔫 ${i}번째 토스트 표시:`, achievements[i].title);
                    showAchievementToast(achievements[i]);
                }, i * 3500); // 0초, 3.5초, 7초
            }
        };
        
        checkSession();
    }, [achievements]);

    return <>
        {/* 업적 토스트 */}
        {achievementToast && (
            <div className="fixed top-25 left-1/2 transform -translate-x-1/2 z-[200] max-w-sm">
                <div className="bg-blue-500/80 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl border border-white/20">
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