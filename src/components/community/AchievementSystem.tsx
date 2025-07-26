'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

interface AchievementSystemProps {
  communityId: string;
}

export default function AchievementSystem({ communityId }: AchievementSystemProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'earned' | 'available' | 'leaderboard'>('earned');

  // Mock achievements for demonstration
  const mockAchievements = [
    {
      id: '1',
      title: 'Welcome Aboard',
      description: 'Join your first community',
      icon: '🎉',
      category: 'Getting Started',
      xpReward: 50,
      earned: true,
      earnedAt: new Date(Date.now() - 86400000 * 30),
      progress: 1,
      target: 1,
      rarity: 'common'
    },
    {
      id: '2',
      title: 'First Steps',
      description: 'Make your first post in the community',
      icon: '✍️',
      category: 'Participation',
      xpReward: 100,
      earned: true,
      earnedAt: new Date(Date.now() - 86400000 * 25),
      progress: 1,
      target: 1,
      rarity: 'common'
    },
    {
      id: '3',
      title: 'Social Butterfly',
      description: 'Send 10 messages to community members',
      icon: '💬',
      category: 'Social',
      xpReward: 200,
      earned: true,
      earnedAt: new Date(Date.now() - 86400000 * 20),
      progress: 10,
      target: 10,
      rarity: 'uncommon'
    },
    {
      id: '4',
      title: 'Event Enthusiast',
      description: 'Attend 5 community events',
      icon: '🎪',
      category: 'Events',
      xpReward: 300,
      earned: false,
      earnedAt: null,
      progress: 3,
      target: 5,
      rarity: 'uncommon'
    },
    {
      id: '5',
      title: 'Community Helper',
      description: 'Help 20 community members with questions or issues',
      icon: '🤝',
      category: 'Helping',
      xpReward: 500,
      earned: true,
      earnedAt: new Date(Date.now() - 86400000 * 10),
      progress: 20,
      target: 20,
      rarity: 'rare'
    },
    {
      id: '6',
      title: 'Knowledge Sharer',
      description: 'Create 25 helpful posts or tutorials',
      icon: '📚',
      category: 'Content',
      xpReward: 400,
      earned: false,
      earnedAt: null,
      progress: 12,
      target: 25,
      rarity: 'rare'
    },
    {
      id: '7',
      title: 'Event Master',
      description: 'Organize and host 10 community events',
      icon: '🎯',
      category: 'Leadership',
      xpReward: 800,
      earned: false,
      earnedAt: null,
      progress: 2,
      target: 10,
      rarity: 'epic'
    },
    {
      id: '8',
      title: 'Community Legend',
      description: 'Reach 10,000 total XP',
      icon: '👑',
      category: 'Prestige',
      xpReward: 1000,
      earned: false,
      earnedAt: null,
      progress: 3200,
      target: 10000,
      rarity: 'legendary'
    }
  ];

  // Mock leaderboard data
  const mockLeaderboard = [
    {
      id: '1',
      name: 'Sarah Johnson',
      avatar: null,
      totalXp: 4500,
      achievementsEarned: 12,
      rank: 1,
      recentAchievement: 'Community Helper'
    },
    {
      id: '2',
      name: 'Mike Chen',
      avatar: null,
      totalXp: 3800,
      achievementsEarned: 10,
      rank: 2,
      recentAchievement: 'Event Enthusiast'
    },
    {
      id: '3',
      name: 'Alex Rodriguez',
      avatar: null,
      totalXp: 3200,
      achievementsEarned: 8,
      rank: 3,
      recentAchievement: 'Knowledge Sharer'
    },
    {
      id: user?.uid || '4',
      name: user?.displayName || 'You',
      avatar: user?.photoURL || null,
      totalXp: 2650,
      achievementsEarned: 7,
      rank: 4,
      recentAchievement: 'Social Butterfly'
    },
    {
      id: '5',
      name: 'Emma Wilson',
      avatar: null,
      totalXp: 2100,
      achievementsEarned: 6,
      rank: 5,
      recentAchievement: 'First Steps'
    }
  ];

  const [achievements] = useState(mockAchievements);
  const [leaderboard] = useState(mockLeaderboard);

  const earnedAchievements = achievements.filter(a => a.earned);
  const availableAchievements = achievements.filter(a => !a.earned);
  const totalXp = earnedAchievements.reduce((sum, achievement) => sum + achievement.xpReward, 0);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'uncommon': return 'text-green-600 bg-green-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300';
      case 'uncommon': return 'border-green-300';
      case 'rare': return 'border-blue-300';
      case 'epic': return 'border-purple-300';
      case 'legendary': return 'border-yellow-300';
      default: return 'border-gray-300';
    }
  };

  const getProgressPercentage = (progress: number, target: number) => {
    return Math.min((progress / target) * 100, 100);
  };

  const TabButton = ({ 
    id, 
    label, 
    count,
    isActive, 
    onClick 
  }: { 
    id: string; 
    label: string; 
    count?: number;
    isActive: boolean; 
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-yellow-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-2 py-1 text-xs rounded-full ${
          isActive ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-700'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Achievement System</h2>
            <p className="text-gray-600">Track your community participation and earn rewards</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-600">{totalXp} XP</div>
            <div className="text-sm text-gray-600">{earnedAchievements.length} achievements earned</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-lg font-semibold text-yellow-800">{earnedAchievements.length}</div>
            <div className="text-sm text-yellow-600">Earned</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-lg font-semibold text-blue-800">{availableAchievements.length}</div>
            <div className="text-sm text-blue-600">Available</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-lg font-semibold text-green-800">{totalXp}</div>
            <div className="text-sm text-green-600">Total XP</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-lg font-semibold text-purple-800">#{leaderboard.find(l => l.id === user?.uid)?.rank || 'N/A'}</div>
            <div className="text-sm text-purple-600">Rank</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mt-6">
          <TabButton
            id="earned"
            label="Earned"
            count={earnedAchievements.length}
            isActive={activeTab === 'earned'}
            onClick={() => setActiveTab('earned')}
          />
          <TabButton
            id="available"
            label="Available"
            count={availableAchievements.length}
            isActive={activeTab === 'available'}
            onClick={() => setActiveTab('available')}
          />
          <TabButton
            id="leaderboard"
            label="Leaderboard"
            isActive={activeTab === 'leaderboard'}
            onClick={() => setActiveTab('leaderboard')}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'leaderboard' ? (
          /* Leaderboard */
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Community Leaderboard</h3>
            
            <div className="space-y-3">
              {leaderboard.map((member, index) => (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    member.id === user?.uid 
                      ? 'border-yellow-300 bg-yellow-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                      member.rank === 1 ? 'bg-yellow-500 text-white' :
                      member.rank === 2 ? 'bg-gray-400 text-white' :
                      member.rank === 3 ? 'bg-amber-600 text-white' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {member.rank <= 3 ? (
                        member.rank === 1 ? '🥇' : member.rank === 2 ? '🥈' : '🥉'
                      ) : (
                        member.rank
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <span className="text-gray-600 font-medium">
                            {member.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-600">
                          Latest: {member.recentAchievement}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{member.totalXp} XP</div>
                    <div className="text-sm text-gray-600">{member.achievementsEarned} achievements</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Achievement Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(activeTab === 'earned' ? earnedAchievements : availableAchievements).map((achievement) => (
              <div
                key={achievement.id}
                className={`border-2 rounded-lg p-6 transition-all ${
                  achievement.earned 
                    ? `${getRarityBorder(achievement.rarity)} bg-gradient-to-br from-white to-gray-50` 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`text-4xl ${achievement.earned ? '' : 'grayscale opacity-50'}`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRarityColor(achievement.rarity)}`}>
                      {achievement.rarity.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-yellow-600">
                      +{achievement.xpReward} XP
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-gray-900">
                      {achievement.progress} / {achievement.target}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        achievement.earned 
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' 
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${getProgressPercentage(achievement.progress, achievement.target)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">{achievement.category}</span>
                  {achievement.earned && achievement.earnedAt && (
                    <span className="text-xs text-gray-500">
                      Earned {achievement.earnedAt.toLocaleDateString()}
                    </span>
                  )}
                </div>

                {achievement.earned && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recent Activity */}
        {activeTab === 'earned' && earnedAchievements.length > 0 && (
          <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-gray-900 mb-4">🎉 Recent Achievements</h4>
            <div className="space-y-2">
              {earnedAchievements
                .sort((a, b) => (b.earnedAt?.getTime() || 0) - (a.earnedAt?.getTime() || 0))
                .slice(0, 3)
                .map((achievement) => (
                  <div key={achievement.id} className="flex items-center space-x-3 text-sm">
                    <span className="text-2xl">{achievement.icon}</span>
                    <span className="font-medium text-gray-900">{achievement.title}</span>
                    <span className="text-yellow-600">+{achievement.xpReward} XP</span>
                    <span className="text-gray-500 ml-auto">
                      {achievement.earnedAt?.toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Progress Tips */}
        {activeTab === 'available' && (
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-4">💡 Quick Tips</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div>• Attend community events to unlock Event Enthusiast</div>
              <div>• Help answer questions in the community chat</div>
              <div>• Share useful resources and tutorials for Knowledge Sharer</div>
              <div>• Stay active and engaged to earn more XP</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
