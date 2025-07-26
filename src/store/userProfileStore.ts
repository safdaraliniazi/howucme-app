import { create } from 'zustand';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from './authStore';
import { useRelationshipStore } from './relationshipStore';
import { 
  AppUser, 
  PrivacySettings, 
  PrivacyLevel, 
  ProfileViewContext,
  Post,
  Relationship 
} from '@/types';

interface UserProfileState {
  profileUser: AppUser | null;
  profilePosts: Post[];
  viewContext: ProfileViewContext | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadUserProfile: (userId: string) => Promise<void>;
  loadUserPosts: (userId: string) => Promise<void>;
  canViewContent: (privacyLevel: PrivacyLevel, relationship?: Relationship, isFamily?: boolean) => boolean;
  getDefaultPrivacySettings: () => PrivacySettings;
  checkPrivacyAccess: (targetUserId: string, contentType: keyof PrivacySettings) => Promise<boolean>;
}

const defaultPrivacySettings: PrivacySettings = {
  profile: 'public',
  posts: 'relationships',
  contact: 'public',
  bio: 'public',
  relationships: 'relationships',
  family: 'family'
};

export const useUserProfileStore = create<UserProfileState>((set, get) => ({
  profileUser: null,
  profilePosts: [],
  viewContext: null,
  loading: false,
  error: null,

  getDefaultPrivacySettings: () => defaultPrivacySettings,

  canViewContent: (privacyLevel: PrivacyLevel, relationship?: Relationship, isFamily?: boolean) => {
    const { user, appUser } = useAuthStore.getState();
    
    if (!user || !appUser) return false;

    switch (privacyLevel) {
      case 'public':
        return true;
      case 'relationships':
        return !!(relationship && relationship.status === 'accepted');
      case 'family':
        return !!isFamily;
      case 'private':
        return false;
      default:
        return false;
    }
  },

  checkPrivacyAccess: async (targetUserId: string, contentType: keyof PrivacySettings) => {
    try {
      const { appUser } = useAuthStore.getState();
      
      if (!appUser) return false;
      
      // Own profile - full access
      if (appUser.uid === targetUserId) return true;

      // Get target user's privacy settings
      const userDoc = await getDoc(doc(db, 'users', targetUserId));
      if (!userDoc.exists()) return false;

      const userData = userDoc.data() as AppUser;
      const privacySettings = userData.privacySettings || defaultPrivacySettings;
      const requiredLevel = privacySettings[contentType];

      // Check relationship status
      const relationshipQuery = query(
        collection(db, 'relationships'),
        where('from', 'in', [appUser.uid, targetUserId]),
        where('to', 'in', [appUser.uid, targetUserId]),
        where('status', '==', 'accepted')
      );
      
      const relationshipSnapshot = await getDocs(relationshipQuery);
      const hasRelationship = !relationshipSnapshot.empty;

      // Check family connection
      const isFamily = !!(userData.familyId && appUser.familyId === userData.familyId);

      return get().canViewContent(requiredLevel, 
        hasRelationship ? relationshipSnapshot.docs[0].data() as Relationship : undefined, 
        isFamily
      );
    } catch (error) {
      console.error('Error checking privacy access:', error);
      return false;
    }
  },

  loadUserProfile: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { appUser } = useAuthStore.getState();
      if (!appUser) {
        throw new Error('Must be logged in to view profiles');
      }

      // Get target user
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data() as any; // Use any to handle Firestore timestamps
      
      // Ensure dates are properly converted
      const processedUserData: AppUser = {
        ...userData,
        createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt || Date.now()),
        birthday: userData.birthday?.toDate ? userData.birthday.toDate() : (userData.birthday ? new Date(userData.birthday) : undefined)
      };
      
      const privacySettings = processedUserData.privacySettings || defaultPrivacySettings;

      // Check if viewing own profile
      if (appUser.uid === userId) {
        set({ 
          profileUser: processedUserData,
          viewContext: {
            viewerUid: appUser.uid,
            targetUid: userId,
            canViewProfile: true,
            canViewPosts: true,
            canMessage: false, // Can't message yourself
            canViewBio: true,
            canViewRelationships: true,
            canViewFamily: true
          }
        });
        return;
      }

      // Check relationship
      const relationshipQuery = query(
        collection(db, 'relationships'),
        where('from', 'in', [appUser.uid, userId]),
        where('to', 'in', [appUser.uid, userId]),
        where('status', '==', 'accepted')
      );
      
      const relationshipSnapshot = await getDocs(relationshipQuery);
      const relationship = relationshipSnapshot.empty ? undefined : relationshipSnapshot.docs[0].data() as Relationship;

      // Check family connection
      const isFamily = !!(processedUserData.familyId && appUser.familyId === processedUserData.familyId);

      // Determine what can be viewed
      const canViewProfile = get().canViewContent(privacySettings.profile, relationship, isFamily);
      const canViewPosts = get().canViewContent(privacySettings.posts, relationship, isFamily);
      const canMessage = get().canViewContent(privacySettings.contact, relationship, isFamily) && 
                         (processedUserData.allowMessagesFromStrangers !== false || !!relationship);
      const canViewBio = get().canViewContent(privacySettings.bio, relationship, isFamily);
      const canViewRelationships = get().canViewContent(privacySettings.relationships, relationship, isFamily);
      const canViewFamily = get().canViewContent(privacySettings.family, relationship, isFamily);

      // Create view context
      const viewContext: ProfileViewContext = {
        viewerUid: appUser.uid,
        targetUid: userId,
        relationship,
        isFamily,
        canViewProfile,
        canViewPosts,
        canMessage,
        canViewBio,
        canViewRelationships,
        canViewFamily
      };

      // Filter user data based on privacy
      const filteredUserData: AppUser = {
        ...processedUserData,
        bio: canViewBio ? processedUserData.bio : undefined,
        email: canViewProfile ? processedUserData.email : processedUserData.email.split('@')[0] + '@...',
        location: canViewProfile ? processedUserData.location : undefined,
        website: canViewProfile ? processedUserData.website : undefined,
        birthday: canViewProfile ? processedUserData.birthday : undefined,
        relationships: canViewRelationships ? processedUserData.relationships : [],
        familyId: canViewFamily ? processedUserData.familyId : undefined
      };

      set({ 
        profileUser: filteredUserData,
        viewContext 
      });

    } catch (error: any) {
      console.error('Error loading user profile:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  loadUserPosts: async (userId: string) => {
    try {
      const { viewContext } = get();
      
      if (!viewContext?.canViewPosts) {
        set({ profilePosts: [] });
        return;
      }

      const postsQuery = query(
        collection(db, 'posts'),
        where('fromUid', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const postsSnapshot = await getDocs(postsQuery);
      const posts: Post[] = [];

      postsSnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          fromUid: data.fromUid,
          text: data.text,
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType,
          anonymous: data.anonymous || false,
          type: data.type || 'regular',
          reactions: data.reactions || { heart: 0, sparkles: 0, clap: 0, star: 0 },
          userReactions: data.userReactions || {},
          createdAt: data.createdAt?.toDate() || new Date(),
          celebrationType: data.celebrationType,
          recognitionType: data.recognitionType,
          targetUserId: data.targetUserId,
          achievementId: data.achievementId
        });
      });

      set({ profilePosts: posts });

    } catch (error: any) {
      console.error('Error loading user posts:', error);
      set({ error: error.message });
    }
  }
}));
