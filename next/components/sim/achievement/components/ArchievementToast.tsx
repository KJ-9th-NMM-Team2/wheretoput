"use client"
import { useState, useEffect, useRef } from "react";

interface AchievementToastProps {
    datas: {
        newlyUnlocked?: any[];
    };
}

export function ArchievementToast({ datas }: AchievementToastProps) {
    const [achievementToast, setAchievementToast] = useState(null);
    const processedRef = useRef(new Set());

    // 업적 토스트 표시 함수
    const showAchievementToasts = (achievements: any[]) => {
        achievements.forEach((achievement, index) => {
            setTimeout(() => {
                setAchievementToast(achievement);
                setTimeout(() => setAchievementToast(null), 3000);
            }, index * 3000);
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