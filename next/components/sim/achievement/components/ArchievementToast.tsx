"use client"
import { useState, useEffect, useRef } from "react";

interface AchievementToastProps {
  datas: {
    newlyUnlocked?: any[];
  };
}

export function ArchievementToast({datas}: AchievementToastProps) {
    const [achievementToast, setAchievementToast] = useState(null);
    const processedRef = useRef(new Set());

    // 업적 토스트 표시 함수
    const showAchievementToasts = (achievements: any[]) => {
        achievements.forEach((achievement, index) => {
            setTimeout(() => {
                setAchievementToast(achievement);
                setTimeout(() => setAchievementToast(null), 2000);
            }, index * 2500);
        });
    };

    // 새로 달성한 업적이 있으면 토스트 표시 (한 번만)
    useEffect(() => {
        if (datas?.newlyUnlocked && datas.newlyUnlocked.length > 0) {
            const achievementIds = datas.newlyUnlocked.map(a => a.id).join(',');
            
            if (!processedRef.current.has(achievementIds)) {
                processedRef.current.add(achievementIds);
                showAchievementToasts(datas.newlyUnlocked);
            }
        }
    }, [datas?.newlyUnlocked]);

    return <>
        {/* 업적 토스트 */}
        {achievementToast && (
            <div className="fixed top-20 transform -translate-x-1/2 z-[200] bg-blue-500 text-white p-4 rounded-lg shadow-lg animate-bounce max-w-sm">
                <div className="flex items-center gap-3 text-white">
                    <div className="text-2xl">{achievementToast.icon || '🏆'}</div>
                    <div>
                        <div className="font-bold text-sm">새로운 업적 달성!</div>
                        <div className="font-semibold">{achievementToast.title}</div>
                        <div className="text-xs opacity-90">{achievementToast.description}</div>
                    </div>
                </div>
            </div>
        )}
    </>
}