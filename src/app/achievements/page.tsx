'use client';

import { useAuthStore } from '@/store/authStore';
import { useAchievementStore } from '@/store/achievementStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import AchievementBadge from '@/components/achievements/AchievementBadge';

export default function AchievementsPage() {
  const { user, appUser, loading: authLoading } = useAuthStore();
  const {
    achievements,
    userAchievements,
    userStats,
    loading,
    fetchAchievements,
    fetchUserAchievements,
    calculateUserStats,
    checkAndUnlockAchievements
  } = useAchievementStore();
  
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All', icon: '🏆' },
    { id: 'kindness', name: 'Kindness', icon: '💝' },
    { id: 'relationships', name: 'Relationships', icon: '🤝' },
    { id: 'engagement', name: 'Engagement', icon: '🌟' },
    { id: 'milestones', name: 'Milestones', icon: '🎯' },
    { id: 'social', name: 'Social', icon: '👥' }
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (appUser) {
      fetchAchievements();
      fetchUserAchievements();
      calculateUserStats();
      checkAndUnlockAchievements();
    }
  }, [appUser]);

  const unlockedAchievements = userAchievements.map(ua => ua.achievementId);
  const filteredAchievements = achievements.filter(achievement =>
    activeCategory === 'all' || achievement.category === activeCategory
  );

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading achievements...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user || !appUser) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Achievements</h1>
              <p className="text-gray-600">Track your progress and celebrate your milestones</p>
            </div>
            <button
              onClick={async () => {
                console.log('Manual achievement check triggered');
                await calculateUserStats();
                await checkAndUnlockAchievements();
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              🔄 Check for New Achievements
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Points</p>
                <p className="text-3xl font-bold">{userStats.totalPoints}</p>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Achievements</p>
                <p className="text-3xl font-bold">{unlockedCount}</p>
                <p className="text-green-100 text-xs">of {totalCount}</p>
              </div>
              <div className="text-4xl">🎯</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Completion</p>
                <p className="text-3xl font-bold">{completionPercentage}%</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Posts Created</p>
                <p className="text-3xl font-bold">{userStats.totalPosts}</p>
              </div>
              <div className="text-4xl">✍️</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Overall Progress</h3>
            <span className="text-sm text-gray-600">{unlockedCount} / {totalCount}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeCategory === category.id
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredAchievements.map((achievement) => {
            const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
            const isUnlocked = !!userAchievement;
            
            return (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  isUnlocked
                    ? 'border-green-200 bg-green-50 hover:border-green-300'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <AchievementBadge
                  achievement={achievement}
                  userAchievement={userAchievement}
                  size="large"
                  showProgress={!isUnlocked}
                />
                
                {isUnlocked && userAchievement && (
                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-500">
                      Unlocked {userAchievement.unlockedAt.toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements in this category</h3>
            <p className="text-gray-500">Try a different category or keep building relationships!</p>
          </div>
        )}

        {/* Recent Activity */}
        {userAchievements.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-6">Recent Achievements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userAchievements.slice(0, 6).map((userAchievement) => {
                const achievement = achievements.find(a => a.id === userAchievement.achievementId);
                if (!achievement) return null;

                return (
                  <div
                    key={userAchievement.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      <AchievementBadge
                        achievement={achievement}
                        userAchievement={userAchievement}
                        size="medium"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{achievement.name}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2">{achievement.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {userAchievement.unlockedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
