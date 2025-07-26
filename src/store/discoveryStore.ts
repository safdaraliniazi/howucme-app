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
  limit,
  getDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Community, 
  Family, 
  DiscoveryPreferences, 
  UserConnection,
  AppUser,
  Post,
  CommunityPost 
} from '@/types';

interface DiscoveryState {
  discoveredCommunities: Community[];
  discoveredFamilies: Family[];
  discoveredPosts: (Post | CommunityPost)[];
  userPreferences: DiscoveryPreferences | null;
  connections: UserConnection[];
  recommendations: {
    communities: Community[];
    families: Family[];
    users: AppUser[];
  };
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchDiscoveredContent: () => Promise<void>;
  searchCommunities: (query: string, filters?: DiscoveryFilters) => Promise<Community[]>;
  searchFamilies: (query: string, filters?: DiscoveryFilters) => Promise<Family[]>;
  searchUsers: (query: string) => Promise<AppUser[]>;
  updateUserPreferences: (preferences: Partial<DiscoveryPreferences>) => Promise<void>;
  fetchUserPreferences: () => Promise<void>;
  generateRecommendations: () => Promise<void>;
  sendConnectionRequest: (toUserId: string, connectionType: UserConnection['connectionType'], message?: string) => Promise<void>;
  handleConnectionRequest: (connectionId: string, action: 'accept' | 'decline') => Promise<void>;
  fetchConnections: () => Promise<void>;
  getDiscoveryFeed: (limit?: number) => Promise<void>;
}

interface DiscoveryFilters {
  location?: {
    city?: string;
    state?: string;
    radius?: number; // in miles
  };
  tags?: string[];
  category?: string;
  memberCount?: {
    min?: number;
    max?: number;
  };
  values?: string[];
  isPublic?: boolean;
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  discoveredCommunities: [],
  discoveredFamilies: [],
  discoveredPosts: [],
  userPreferences: null,
  connections: [],
  recommendations: {
    communities: [],
    families: [],
    users: []
  },
  loading: false,
  error: null,

  fetchDiscoveredContent: async () => {
    try {
      set({ loading: true, error: null });

      // Fetch public communities - simplified query to avoid index requirements
      const communitiesQuery = query(
        collection(db, 'communities'),
        where('isPublic', '==', true),
        limit(20)
      );

      const communitiesSnapshot = await getDocs(communitiesQuery);
      const communities: Community[] = [];

      communitiesSnapshot.forEach((doc) => {
        const data = doc.data() as any;
        // Only include active communities
        if (data.isActive) {
          communities.push({
            id: doc.id,
            name: data.name,
            description: data.description,
            category: data.category,
            tags: data.tags || [],
            coverImageUrl: data.coverImageUrl,
            iconUrl: data.iconUrl,
            createdBy: data.createdBy,
            moderators: data.moderators || [],
            memberCount: data.memberCount || 0,
            maxMembers: data.maxMembers,
            isPublic: data.isPublic,
            location: data.location,
            rules: data.rules || [],
            welcomeMessage: data.welcomeMessage,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastActivity: data.lastActivity?.toDate() || new Date(),
            isActive: data.isActive
          });
        }
      });

      // Sort by last activity (client-side)
      communities.sort((a, b) => 
        b.lastActivity.getTime() - a.lastActivity.getTime()
      );

      // Fetch public families - simplified query to avoid index requirements
      const familiesQuery = query(
        collection(db, 'families'),
        where('isPublic', '==', true),
        limit(15)
      );

      const familiesSnapshot = await getDocs(familiesQuery);
      const families: Family[] = [];

      familiesSnapshot.forEach((doc) => {
        const data = doc.data() as any;
        families.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          motto: data.motto,
          values: data.values || [],
          crestUrl: data.crestUrl,
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate() || new Date(),
          isPublic: data.isPublic || false,
          inviteCode: data.inviteCode,
          memberCount: data.memberCount || 0,
          maxMembers: data.maxMembers,
          members: [], // Will be populated separately if needed
          rituals: data.rituals || []
        });
      });

      // Sort families by creation date (client-side)
      families.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );

      set({ 
        discoveredCommunities: communities,
        discoveredFamilies: families 
      });

      console.log('Discovery content fetched:', { communities: communities.length, families: families.length });
    } catch (error: any) {
      console.error('Error fetching discovered content:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  searchCommunities: async (searchQuery: string, filters?: DiscoveryFilters) => {
    try {
      set({ loading: true, error: null });

      // Use simple query to avoid index requirements
      const dbQuery = query(
        collection(db, 'communities'),
        where('isPublic', '==', true),
        limit(50)
      );

      const querySnapshot = await getDocs(dbQuery);
      const communities: Community[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        communities.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          category: data.category,
          tags: data.tags || [],
          coverImageUrl: data.coverImageUrl,
          iconUrl: data.iconUrl,
          createdBy: data.createdBy,
          moderators: data.moderators || [],
          memberCount: data.memberCount || 0,
          maxMembers: data.maxMembers,
          isPublic: data.isPublic,
          location: data.location,
          rules: data.rules || [],
          welcomeMessage: data.welcomeMessage,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastActivity: data.lastActivity?.toDate() || new Date(),
          isActive: data.isActive
        });
      });

      // Apply client-side filters
      let filteredCommunities = communities;

      // Filter by active status
      filteredCommunities = filteredCommunities.filter(community => community.isActive);

      // Apply Firestore filters client-side to avoid index requirements
      if (filters?.isPublic !== undefined) {
        filteredCommunities = filteredCommunities.filter(community => 
          community.isPublic === filters.isPublic
        );
      }

      if (filters?.category) {
        filteredCommunities = filteredCommunities.filter(community => 
          community.category.id === filters.category
        );
      }

      // Text search
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        filteredCommunities = filteredCommunities.filter(community =>
          community.name.toLowerCase().includes(searchLower) ||
          community.description.toLowerCase().includes(searchLower) ||
          community.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      // Tag filters
      if (filters?.tags && filters.tags.length > 0) {
        filteredCommunities = filteredCommunities.filter(community =>
          filters.tags!.some(tag => community.tags.includes(tag))
        );
      }

      // Member count filters
      if (filters?.memberCount) {
        filteredCommunities = filteredCommunities.filter(community => {
          const memberCount = community.memberCount;
          if (filters.memberCount!.min && memberCount < filters.memberCount!.min) return false;
          if (filters.memberCount!.max && memberCount > filters.memberCount!.max) return false;
          return true;
        });
      }

      // Values filters
      if (filters?.values && filters.values.length > 0) {
        filteredCommunities = filteredCommunities.filter(community =>
          filters.values!.some(value => community.tags.includes(value))
        );
      }

      set({ loading: false });
      return filteredCommunities;
    } catch (error: any) {
      console.error('Error searching communities:', error);
      set({ error: error.message, loading: false });
      return [];
    }
  },

  searchFamilies: async (searchQuery: string, filters?: DiscoveryFilters) => {
    try {
      set({ loading: true, error: null });

      const dbQuery = query(
        collection(db, 'families'),
        where('isPublic', '==', true),
        limit(50)
      );

      const querySnapshot = await getDocs(dbQuery);
      const families: Family[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        families.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          motto: data.motto,
          values: data.values || [],
          crestUrl: data.crestUrl,
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate() || new Date(),
          isPublic: data.isPublic || false,
          inviteCode: data.inviteCode,
          memberCount: data.memberCount || 0,
          maxMembers: data.maxMembers,
          members: [],
          rituals: data.rituals || []
        });
      });

      // Apply client-side filters
      let filteredFamilies = families;

      // Text search
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        filteredFamilies = filteredFamilies.filter(family =>
          family.name.toLowerCase().includes(searchLower) ||
          family.description?.toLowerCase().includes(searchLower) ||
          family.motto?.toLowerCase().includes(searchLower) ||
          (family.values && family.values.some(value => value.toLowerCase().includes(searchLower)))
        );
      }

      // Values filters
      if (filters?.values && filters.values.length > 0) {
        filteredFamilies = filteredFamilies.filter(family =>
          filters.values!.some(value => family.values && family.values.includes(value))
        );
      }

      // Member count filters
      if (filters?.memberCount) {
        filteredFamilies = filteredFamilies.filter(family => {
          const memberCount = family.memberCount;
          if (filters.memberCount!.min && memberCount < filters.memberCount!.min) return false;
          if (filters.memberCount!.max && memberCount > filters.memberCount!.max) return false;
          return true;
        });
      }

      set({ loading: false });
      return filteredFamilies;
    } catch (error: any) {
      console.error('Error searching families:', error);
      set({ error: error.message, loading: false });
      return [];
    }
  },

  searchUsers: async (searchQuery: string) => {
    try {
      set({ loading: true, error: null });

      // For now, we'll fetch all users and filter client-side
      // In production, you'd want a proper search index
      const usersQuery = query(
        collection(db, 'users'),
        limit(100)
      );

      const querySnapshot = await getDocs(usersQuery);
      const users: AppUser[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        users.push({
          uid: doc.id,
          name: data.name,
          email: data.email,
          bio: data.bio,
          profilePicUrl: data.profilePicUrl,
          familyId: data.familyId,
          relationships: data.relationships || [],
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });

      // Filter by search query
      const searchLower = searchQuery.toLowerCase();
      const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.bio?.toLowerCase().includes(searchLower)
      );

      set({ loading: false });
      return filteredUsers;
    } catch (error: any) {
      console.error('Error searching users:', error);
      set({ error: error.message, loading: false });
      return [];
    }
  },

  updateUserPreferences: async (preferences: Partial<DiscoveryPreferences>) => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to update preferences');
      }

      const { userPreferences } = get();
      const updatedPreferences: DiscoveryPreferences = {
        userId: currentUser.uid,
        interests: [],
        preferredCommunityTypes: [],
        values: [],
        dealBreakers: [],
        isOpenToNewConnections: true,
        ...userPreferences,
        ...preferences,
        updatedAt: new Date()
      };

      // Check if preferences document exists
      const preferencesQuery = query(
        collection(db, 'discoveryPreferences'),
        where('userId', '==', currentUser.uid)
      );

      const preferencesSnapshot = await getDocs(preferencesQuery);

      if (preferencesSnapshot.empty) {
        // Create new preferences document
        await addDoc(collection(db, 'discoveryPreferences'), {
          ...updatedPreferences,
          updatedAt: serverTimestamp()
        });
      } else {
        // Update existing preferences
        const preferencesDoc = preferencesSnapshot.docs[0];
        await updateDoc(preferencesDoc.ref, {
          ...preferences,
          updatedAt: serverTimestamp()
        });
      }

      set({ userPreferences: updatedPreferences });
      
      // Regenerate recommendations with new preferences
      await get().generateRecommendations();
    } catch (error: any) {
      console.error('Error updating user preferences:', error);
      set({ error: error.message });
      throw error;
    }
  },

  fetchUserPreferences: async () => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        set({ userPreferences: null });
        return;
      }

      const preferencesQuery = query(
        collection(db, 'discoveryPreferences'),
        where('userId', '==', currentUser.uid)
      );

      const preferencesSnapshot = await getDocs(preferencesQuery);

      if (!preferencesSnapshot.empty) {
        const data = preferencesSnapshot.docs[0].data();
        const preferences: DiscoveryPreferences = {
          userId: data.userId,
          interests: data.interests || [],
          preferredCommunityTypes: data.preferredCommunityTypes || [],
          locationRadius: data.locationRadius,
          ageRange: data.ageRange,
          familySize: data.familySize,
          values: data.values || [],
          dealBreakers: data.dealBreakers || [],
          isOpenToNewConnections: data.isOpenToNewConnections ?? true,
          updatedAt: data.updatedAt?.toDate() || new Date()
        };

        set({ userPreferences: preferences });
      } else {
        // Create default preferences
        const defaultPreferences: DiscoveryPreferences = {
          userId: currentUser.uid,
          interests: [],
          preferredCommunityTypes: [],
          values: [],
          dealBreakers: [],
          isOpenToNewConnections: true,
          updatedAt: new Date()
        };

        set({ userPreferences: defaultPreferences });
      }
    } catch (error: any) {
      console.error('Error fetching user preferences:', error);
      set({ error: error.message });
    }
  },

  generateRecommendations: async () => {
    try {
      const { userPreferences } = get();
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser || !userPreferences) {
        return;
      }

      // Generate community recommendations based on user preferences
      const communityRecommendations: Community[] = [];
      const familyRecommendations: Family[] = [];
      const userRecommendations: AppUser[] = [];

      // Fetch communities that match user interests and values
      if (userPreferences.interests.length > 0 || userPreferences.values.length > 0) {
        const communitiesQuery = query(
          collection(db, 'communities'),
          where('isPublic', '==', true),
          limit(10)
        );

        const communitiesSnapshot = await getDocs(communitiesQuery);
        
        communitiesSnapshot.forEach((doc) => {
          const data = doc.data() as any;
          // Only include active communities
          if (data.isActive) {
            const community: Community = {
              id: doc.id,
              name: data.name,
              description: data.description,
              category: data.category,
              tags: data.tags || [],
              coverImageUrl: data.coverImageUrl,
            iconUrl: data.iconUrl,
            createdBy: data.createdBy,
            moderators: data.moderators || [],
            memberCount: data.memberCount || 0,
            maxMembers: data.maxMembers,
            isPublic: data.isPublic,
            location: data.location,
            rules: data.rules || [],
            welcomeMessage: data.welcomeMessage,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastActivity: data.lastActivity?.toDate() || new Date(),
            isActive: data.isActive
          };

          // Simple matching algorithm based on tags and interests
          const matchScore = calculateCommunityMatchScore(community, userPreferences);
          if (matchScore > 0.3) { // 30% match threshold
            communityRecommendations.push(community);
          }
          }
        });
      }

      // Similar logic for families and users...
      // For now, we'll just use a simple approach

      set({
        recommendations: {
          communities: communityRecommendations.slice(0, 6),
          families: familyRecommendations.slice(0, 4),
          users: userRecommendations.slice(0, 5)
        }
      });

      console.log('Recommendations generated:', {
        communities: communityRecommendations.length,
        families: familyRecommendations.length,
        users: userRecommendations.length
      });
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      set({ error: error.message });
    }
  },

  sendConnectionRequest: async (toUserId: string, connectionType: UserConnection['connectionType'], message?: string) => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to send connection requests');
      }

      // Check if connection already exists
      const existingConnectionQuery = query(
        collection(db, 'userConnections'),
        where('fromUserId', '==', currentUser.uid),
        where('toUserId', '==', toUserId)
      );

      const existingConnectionSnapshot = await getDocs(existingConnectionQuery);
      if (!existingConnectionSnapshot.empty) {
        throw new Error('Connection request already exists');
      }

      const connectionData: Omit<UserConnection, 'id'> = {
        fromUserId: currentUser.uid,
        toUserId,
        status: 'pending',
        connectionType,
        sharedCommunities: [], // Could be calculated
        sharedFamilies: [], // Could be calculated
        createdAt: new Date()
      };

      await addDoc(collection(db, 'userConnections'), {
        ...connectionData,
        createdAt: serverTimestamp()
      });

      console.log('Connection request sent to user:', toUserId);
    } catch (error: any) {
      console.error('Error sending connection request:', error);
      set({ error: error.message });
      throw error;
    }
  },

  handleConnectionRequest: async (connectionId: string, action: 'accept' | 'decline') => {
    try {
      const updateData: any = {
        status: action === 'accept' ? 'accepted' : 'declined'
      };

      if (action === 'accept') {
        updateData.acceptedAt = serverTimestamp();
      }

      await updateDoc(doc(db, 'userConnections', connectionId), updateData);

      console.log(`Connection request ${action}ed:`, connectionId);
      
      // Refresh connections
      await get().fetchConnections();
    } catch (error: any) {
      console.error('Error handling connection request:', error);
      set({ error: error.message });
      throw error;
    }
  },

  fetchConnections: async () => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        set({ connections: [] });
        return;
      }

      // Fetch connections where user is either sender or receiver
      const sentConnectionsQuery = query(
        collection(db, 'userConnections'),
        where('fromUserId', '==', currentUser.uid)
      );

      const receivedConnectionsQuery = query(
        collection(db, 'userConnections'),
        where('toUserId', '==', currentUser.uid)
      );

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentConnectionsQuery),
        getDocs(receivedConnectionsQuery)
      ]);

      const connections: UserConnection[] = [];

      sentSnapshot.forEach((doc) => {
        const data = doc.data();
        connections.push({
          id: doc.id,
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          status: data.status,
          connectionType: data.connectionType,
          sharedCommunities: data.sharedCommunities || [],
          sharedFamilies: data.sharedFamilies || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          acceptedAt: data.acceptedAt?.toDate()
        });
      });

      receivedSnapshot.forEach((doc) => {
        const data = doc.data();
        connections.push({
          id: doc.id,
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          status: data.status,
          connectionType: data.connectionType,
          sharedCommunities: data.sharedCommunities || [],
          sharedFamilies: data.sharedFamilies || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          acceptedAt: data.acceptedAt?.toDate()
        });
      });

      set({ connections });
    } catch (error: any) {
      console.error('Error fetching connections:', error);
      set({ error: error.message });
    }
  },

  getDiscoveryFeed: async (maxLimit: number = 30) => {
    try {
      set({ loading: true, error: null });

      // Simplified queries to avoid index requirements
      const communityPostsQuery = query(
        collection(db, 'communityPosts'),
        limit(Math.floor(maxLimit * 0.7)) // 70% community posts
      );

      const regularPostsQuery = query(
        collection(db, 'posts'),
        where('anonymous', '==', false),
        limit(Math.floor(maxLimit * 0.3)) // 30% regular posts
      );

      const [communityPostsSnapshot, regularPostsSnapshot] = await Promise.all([
        getDocs(communityPostsQuery),
        getDocs(regularPostsQuery)
      ]);

      const posts: (Post | CommunityPost)[] = [];

      // Add community posts
      communityPostsSnapshot.forEach((doc) => {
        const data = doc.data() as any;
        posts.push({
          id: doc.id,
          communityId: data.communityId,
          fromUid: data.fromUid,
          content: data.content,
          type: data.type,
          tags: data.tags || [],
          attachments: data.attachments,
          reactions: data.reactions || {},
          userReactions: data.userReactions || {},
          comments: data.comments || [],
          isPinned: data.isPinned || false,
          isModerated: data.isModerated || false,
          createdAt: data.createdAt?.toDate() || new Date()
        } as CommunityPost);
      });

      // Add regular posts
      regularPostsSnapshot.forEach((doc) => {
        const data = doc.data() as any;
        posts.push({
          id: doc.id,
          fromUid: data.fromUid,
          text: data.text,
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType,
          anonymous: data.anonymous,
          type: data.type,
          celebrationType: data.celebrationType,
          recognitionType: data.recognitionType,
          targetUserId: data.targetUserId,
          achievementId: data.achievementId,
          reactions: data.reactions || {
            heart: 0,
            sparkles: 0,
            clap: 0,
            star: 0
          },
          userReactions: data.userReactions || {},
          createdAt: data.createdAt?.toDate() || new Date()
        } as Post);
      });

      // Sort by creation date
      posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      set({ discoveredPosts: posts });
    } catch (error: any) {
      console.error('Error fetching discovery feed:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  }
}));

// Helper function to calculate community match score
function calculateCommunityMatchScore(community: Community, preferences: DiscoveryPreferences): number {
  let score = 0;
  let factors = 0;

  // Check interest alignment
  if (preferences.interests.length > 0) {
    const interestMatches = preferences.interests.filter(interest =>
      community.tags.some(tag => tag.toLowerCase().includes(interest.toLowerCase())) ||
      community.description.toLowerCase().includes(interest.toLowerCase())
    ).length;
    
    score += (interestMatches / preferences.interests.length) * 0.4;
    factors += 0.4;
  }

  // Check values alignment
  if (preferences.values.length > 0) {
    const valueMatches = preferences.values.filter(value =>
      community.tags.some(tag => tag.toLowerCase().includes(value.toLowerCase()))
    ).length;
    
    score += (valueMatches / preferences.values.length) * 0.4;
    factors += 0.4;
  }

  // Check community type preference
  if (preferences.preferredCommunityTypes.length > 0) {
    const typeMatch = preferences.preferredCommunityTypes.includes(community.category.id);
    if (typeMatch) {
      score += 0.2;
    }
    factors += 0.2;
  }

  return factors > 0 ? score / factors : 0;
}
