"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function AchievementList() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const {data: session} = useSession();

  useEffect(() => {
    const fetchAchievements = async () => {
      await fetch(`/api/users/${session?.user?.id}/achievements`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAchievements(data);
        } else {
          console.error('Invalid achievements data:', data);
          setAchievements([]);
        }
      })
      .finally(() => setLoading(false));
    }
    fetchAchievements();
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg"> Loading...</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {Array.isArray(achievements) && achievements.map(achievement => (
        <div 
          key={achievement.id} 
          className={`p-4 rounded-lg border ${
            achievement.unlocked 
              ? 'bg-amber-50 border-amber-200 dark:bg-amber-50 dark:border-amber-200' 
              : 'bg-gray-50 border-gray-200 opacity-50 dark:bg-gray-800 dark:border-gray-600'
          }`}
        >
          <div className="text-3xl mb-2">{achievement.icon}</div>
          <h3 className={`font-bold mb-1 ${
            achievement.unlocked 
              ? 'text-gray-800 dark:text-gray-800' 
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            {achievement.title}
          </h3>
          <p className={`text-sm ${
            achievement.unlocked 
              ? 'text-gray-600 dark:text-gray-600' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {achievement.description}
          </p>
          {achievement.unlocked && (
            <div className="mt-2 text-xs text-amber-700 dark:text-amber-700 font-medium">
              ✓ 달성완료
            </div>
          )}
        </div>
      ))}
    </div>
  );
}