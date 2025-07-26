'use client';

import { Achievement, UserAchievement } from '@/types';

interface AchievementBadgeProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  isLocked?: boolean;
}

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  uncommon: 'from-green-400 to-green-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-yellow-600'
};

const sizeClasses = {
  small: 'w-12 h-12 text-lg',
  medium: 'w-16 h-16 text-2xl',
  large: 'w-24 h-24 text-4xl'
};

export default function AchievementBadge({
  achievement,
  userAchievement,
  size = 'medium',
  showProgress = false,
  isLocked = false
}: AchievementBadgeProps) {
  const isUnlocked = !!userAchievement;
  const progress = userAchievement?.progress || 0;
  const progressPercent = Math.min((progress / achievement.criteria.target) * 100, 100);

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Badge */}
      <div className="relative">
        <div
          className={`
            ${sizeClasses[size]} 
            rounded-full flex items-center justify-center font-bold text-white
            ${isUnlocked 
              ? `bg-gradient-to-br ${rarityColors[achievement.rarity]} shadow-lg` 
              : 'bg-gray-300 grayscale'
            }
            ${isLocked ? 'opacity-50' : ''}
            transition-all duration-300 hover:scale-110
          `}
        >
          {isLocked ? '🔒' : achievement.icon}
        </div>

        {/* Rarity indicator */}
        {isUnlocked && (
          <div className="absolute -top-1 -right-1">
            {achievement.rarity === 'legendary' && <span className="text-yellow-400">⭐</span>}
            {achievement.rarity === 'epic' && <span className="text-purple-400">💎</span>}
            {achievement.rarity === 'rare' && <span className="text-blue-400">💠</span>}
          </div>
        )}

        {/* Progress ring for locked achievements */}
        {!isUnlocked && showProgress && progressPercent > 0 && (
          <div className="absolute inset-0 rounded-full">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${progressPercent * 2.827} 282.7`}
                className="text-blue-500 transition-all duration-300"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Achievement info */}
      <div className="text-center max-w-24">
        <h4 className={`font-semibold ${isLocked ? 'text-gray-400' : 'text-gray-900'} ${
          size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base'
        }`}>
          {isLocked ? 'Hidden Achievement' : achievement.name}
        </h4>
        
        {!isLocked && (
          <p className={`text-gray-600 ${
            size === 'small' ? 'text-xs' : 'text-sm'
          }`}>
            {achievement.description}
          </p>
        )}

        {/* Points */}
        {isUnlocked && (
          <div className="flex items-center justify-center space-x-1 mt-1">
            <span className="text-yellow-500">🏆</span>
            <span className={`font-medium text-yellow-600 ${
              size === 'small' ? 'text-xs' : 'text-sm'
            }`}>
              {achievement.points} pts
            </span>
          </div>
        )}

        {/* Progress */}
        {!isUnlocked && showProgress && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {progress} / {achievement.criteria.target}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
