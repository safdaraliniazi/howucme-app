import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Achievement, UserAchievement } from '@/types';

interface AchievementState {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  recentUnlocks: UserAchievement[];
  userStats: {
    totalPoints: number;
    achievementsUnlocked: number;
    currentStreak: number;
    totalPosts: number;
    totalReactions: number;
    totalRelationships: number;
    daysActive: number;
  };
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchAchievements: () => Promise<void>;
  fetchUserAchievements: (userId?: string) => Promise<void>;
  checkAndUnlockAchievements: () => Promise<void>;
  updateAchievementDisplay: (userAchievementId: string, isDisplayed: boolean) => Promise<void>;
  calculateUserStats: () => Promise<void>;
}

// Predefined achievements
const DEFAULT_ACHIEVEMENTS: Omit<Achievement, 'id'>[] = [
  {
    name: 'First Steps',
    description: 'Create your first post',
    category: 'kindness',
    icon: '👋',
    criteria: { type: 'post_count', target: 1 },
    rarity: 'common',
    points: 10
  },
  {
    name: 'Kindness Warrior',
    description: 'Create 10 posts sharing kindness',
    category: 'kindness',
    icon: '💝',
    criteria: { type: 'post_count', target: 10 },
    rarity: 'uncommon',
    points: 50
  },
  {
    name: 'Connection Builder',
    description: 'Form 5 relationships',
    category: 'relationships',
    icon: '🤝',
    criteria: { type: 'relationship_count', target: 5 },
    rarity: 'uncommon',
    points: 75
  },
  {
    name: 'Social Butterfly',
    description: 'Receive 100 reactions on your posts',
    category: 'engagement',
    icon: '🦋',
    criteria: { type: 'reaction_count', target: 100 },
    rarity: 'rare',
    points: 100
  },
  {
    name: 'Chosen Family',
    description: 'Form 10 meaningful relationships',
    category: 'relationships',
    icon: '👨‍👩‍👧‍👦',
    criteria: { type: 'relationship_count', target: 10 },
    rarity: 'epic',
    points: 200
  },
  {
    name: 'Streak Master',
    description: 'Stay active for 30 consecutive days',
    category: 'engagement',
    icon: '🔥',
    criteria: { type: 'days_active', target: 30 },
    rarity: 'epic',
    points: 150
  },
  {
    name: 'Kindness Legend',
    description: 'Create 100 posts spreading kindness',
    category: 'kindness',
    icon: '⭐',
    criteria: { type: 'post_count', target: 100 },
    rarity: 'legendary',
    points: 500
  }
];

export const useAchievementStore = create<AchievementState>((set, get) => ({
  achievements: [],
  userAchievements: [],
  recentUnlocks: [],
  userStats: {
    totalPoints: 0,
    achievementsUnlocked: 0,
    currentStreak: 0,
    totalPosts: 0,
    totalReactions: 0,
    totalRelationships: 0,
    daysActive: 0
  },
  loading: false,
  error: null,

  fetchAchievements: async () => {
    try {
      set({ loading: true, error: null });

      // Check if achievements exist, if not create them
      const q = query(collection(db, 'achievements'));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('Creating default achievements...');
        // Create default achievements
        for (const achievement of DEFAULT_ACHIEVEMENTS) {
          await addDoc(collection(db, 'achievements'), achievement);
        }
      }

      // Fetch all achievements
      const achievementsSnapshot = await getDocs(q);
      const achievements: Achievement[] = [];

      achievementsSnapshot.forEach((doc) => {
        const data = doc.data();
        achievements.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          category: data.category,
          icon: data.icon,
          criteria: data.criteria,
          rarity: data.rarity,
          points: data.points,
        });
      });

      set({ achievements, loading: false });
      console.log('Achievements fetched successfully:', achievements.length);
    } catch (error: any) {
      console.error('Error fetching achievements:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchUserAchievements: async (userId?: string) => {
    try {
      // Get current user
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      const targetUserId = userId || currentUser?.uid;
      
      if (!targetUserId) {
        set({ userAchievements: [] });
        return;
      }

      const q = query(
        collection(db, 'userAchievements'),
        where('userId', '==', targetUserId)
        // Removed orderBy to avoid index requirement - we'll sort client-side
      );

      const querySnapshot = await getDocs(q);
      const userAchievements: UserAchievement[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        userAchievements.push({
          id: doc.id,
          userId: data.userId,
          achievementId: data.achievementId,
          unlockedAt: data.unlockedAt?.toDate() || new Date(),
          progress: data.progress || 0,
          isDisplayed: data.isDisplayed !== false, // Default to true
        });
      });

      // Sort by unlock date (most recent first) on client side
      userAchievements.sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime());

      set({ userAchievements });
      
      // Calculate total points
      const { achievements } = get();
      const totalPoints = userAchievements.reduce((sum, ua) => {
        const achievement = achievements.find(a => a.id === ua.achievementId);
        return sum + (achievement?.points || 0);
      }, 0);

      set(state => ({
        userStats: {
          ...state.userStats,
          totalPoints,
          achievementsUnlocked: userAchievements.length
        }
      }));

      console.log('User achievements fetched successfully:', userAchievements.length);
    } catch (error: any) {
      console.error('Error fetching user achievements:', error);
      set({ error: error.message });
    }
  },

  checkAndUnlockAchievements: async () => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) return;

      // Calculate current user stats
      await get().calculateUserStats();
      
      const { achievements, userAchievements, userStats } = get();
      const unlockedAchievementIds = new Set(userAchievements.map(ua => ua.achievementId));

      // Check each achievement
      for (const achievement of achievements) {
        if (unlockedAchievementIds.has(achievement.id)) continue;

        let isUnlocked = false;

        switch (achievement.criteria.type) {
          case 'post_count':
            isUnlocked = userStats.totalPosts >= achievement.criteria.target;
            break;
          case 'reaction_count':
            isUnlocked = userStats.totalReactions >= achievement.criteria.target;
            break;
          case 'relationship_count':
            isUnlocked = userStats.totalRelationships >= achievement.criteria.target;
            break;
          case 'days_active':
            isUnlocked = userStats.daysActive >= achievement.criteria.target;
            break;
        }

        if (isUnlocked) {
          console.log('Unlocking achievement:', achievement.name);
          
          const userAchievementData = {
            userId: currentUser.uid,
            achievementId: achievement.id,
            unlockedAt: serverTimestamp(),
            progress: achievement.criteria.target,
            isDisplayed: true,
          };

          const docRef = await addDoc(collection(db, 'userAchievements'), userAchievementData);
          
          // Add to recent unlocks for UI notification
          const newUnlock: UserAchievement = {
            id: docRef.id,
            userId: currentUser.uid,
            achievementId: achievement.id,
            unlockedAt: new Date(),
            progress: achievement.criteria.target,
            isDisplayed: true,
          };

          set(state => ({
            userAchievements: [...state.userAchievements, newUnlock],
            recentUnlocks: [...state.recentUnlocks, newUnlock]
          }));
        }
      }
    } catch (error: any) {
      console.error('Error checking achievements:', error);
      set({ error: error.message });
    }
  },

  updateAchievementDisplay: async (userAchievementId: string, isDisplayed: boolean) => {
    try {
      const userAchievementRef = doc(db, 'userAchievements', userAchievementId);
      await updateDoc(userAchievementRef, { isDisplayed });

      // Update local state
      set(state => ({
        userAchievements: state.userAchievements.map(ua =>
          ua.id === userAchievementId ? { ...ua, isDisplayed } : ua
        )
      }));

      console.log('Achievement display updated');
    } catch (error: any) {
      console.error('Error updating achievement display:', error);
      set({ error: error.message });
    }
  },

  calculateUserStats: async () => {
    try {
      const { useAuthStore } = await import('./authStore');
      const { usePostStore } = await import('./postStore');
      const { useRelationshipStore } = await import('./relationshipStore');
      
      const currentUser = useAuthStore.getState().appUser;
      if (!currentUser) return;

      // Get posts count
      const postsQuery = query(
        collection(db, 'posts'),
        where('fromUid', '==', currentUser.uid)
      );
      const postsSnapshot = await getDocs(postsQuery);
      const totalPosts = postsSnapshot.size;

      // Calculate total reactions received
      let totalReactions = 0;
      postsSnapshot.forEach((doc) => {
        const data = doc.data();
        const reactions = data.reactions || {};
        totalReactions += Object.values(reactions).reduce((sum: number, count) => sum + (count as number), 0);
      });

      // Get relationships count
      const relationshipsQuery = query(
        collection(db, 'relationships'),
        where('status', '==', 'accepted')
      );
      const relationshipsSnapshot = await getDocs(relationshipsQuery);
      let totalRelationships = 0;
      
      relationshipsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.from === currentUser.uid || data.to === currentUser.uid) {
          totalRelationships++;
        }
      });

      // Calculate days active (simplified - based on account age for now)
      // Handle Firestore Timestamp objects
      let createdAtDate: Date;
      if (currentUser.createdAt instanceof Date) {
        createdAtDate = currentUser.createdAt;
      } else if (currentUser.createdAt && typeof currentUser.createdAt === 'object' && 'toDate' in currentUser.createdAt) {
        createdAtDate = (currentUser.createdAt as any).toDate();
      } else {
        createdAtDate = new Date();
      }
      
      const accountAge = Math.floor((new Date().getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysActive = Math.min(accountAge, totalPosts); // Rough estimate

      const userStats = {
        totalPoints: get().userStats.totalPoints, // Keep existing points
        achievementsUnlocked: get().userStats.achievementsUnlocked, // Keep existing count
        currentStreak: 0, // TODO: Implement streak calculation
        totalPosts,
        totalReactions,
        totalRelationships,
        daysActive
      };

      set({ userStats });
      console.log('User stats calculated:', userStats);
    } catch (error: any) {
      console.error('Error calculating user stats:', error);
      set({ error: error.message });
    }
  },
}));
