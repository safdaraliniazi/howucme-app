import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query, 
  where,
  serverTimestamp,
  onSnapshot,
  limit,
  getDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Community, 
  CommunityMember, 
  CommunityPost, 
  CommunityEvent, 
  CommunityRole, 
  CommunityCategory,
  JoinRequest 
} from '@/types';

interface CommunityState {
  communities: Community[];
  userCommunities: Community[];
  currentCommunity: Community | null;
  communityMembers: CommunityMember[];
  communityPosts: CommunityPost[];
  communityEvents: CommunityEvent[];
  joinRequests: JoinRequest[];
  categories: CommunityCategory[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchCommunities: (filters?: CommunityFilters) => Promise<void>;
  fetchUserCommunities: () => Promise<void>;
  fetchCommunity: (communityId: string) => Promise<void>;
  createCommunity: (communityData: Omit<Community, 'id' | 'createdAt' | 'memberCount' | 'lastActivity'>) => Promise<string>;
  joinCommunity: (communityId: string, message?: string) => Promise<void>;
  leaveCommunity: (communityId: string) => Promise<void>;
  sendJoinRequest: (targetType: 'family' | 'community', targetId: string, message?: string) => Promise<void>;
  handleJoinRequest: (requestId: string, action: 'accept' | 'decline') => Promise<void>;
  fetchCommunityMembers: (communityId: string) => Promise<void>;
  updateMemberRole: (memberId: string, newRole: CommunityRole) => Promise<void>;
  createCommunityPost: (communityId: string, content: string, type: CommunityPost['type'], tags?: string[]) => Promise<void>;
  fetchCommunityPosts: (communityId: string) => Promise<void>;
  createCommunityEvent: (eventData: Omit<CommunityEvent, 'id' | 'createdAt' | 'attendees'>) => Promise<void>;
  fetchCommunityEvents: (communityId?: string) => Promise<void>;
  rsvpToEvent: (eventId: string, attending: boolean) => Promise<void>;
}

interface CommunityFilters {
  category?: string;
  tags?: string[];
  location?: string;
  maxMembers?: number;
  isPublic?: boolean;
  searchQuery?: string;
}

// Default community categories
const DEFAULT_CATEGORIES: CommunityCategory[] = [
  {
    id: 'support',
    name: 'Support & Wellness',
    description: 'Mental health, addiction recovery, grief support, and personal growth',
    icon: '🤝',
    color: 'bg-green-500'
  },
  {
    id: 'creative',
    name: 'Creative Arts',
    description: 'Writing, music, visual arts, crafts, and creative expression',
    icon: '🎨',
    color: 'bg-purple-500'
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle & Hobbies',
    description: 'Cooking, gardening, fitness, travel, and personal interests',
    icon: '🌟',
    color: 'bg-blue-500'
  },
  {
    id: 'learning',
    name: 'Learning & Growth',
    description: 'Study groups, skill sharing, professional development, and education',
    icon: '📚',
    color: 'bg-orange-500'
  },
  {
    id: 'social',
    name: 'Social & Events',
    description: 'Social gatherings, game nights, meetups, and community events',
    icon: '🎉',
    color: 'bg-pink-500'
  },
  {
    id: 'identity',
    name: 'Identity & Culture',
    description: 'LGBTQ+, cultural groups, faith communities, and identity-based support',
    icon: '🏳️‍🌈',
    color: 'bg-indigo-500'
  },
  {
    id: 'local',
    name: 'Local Communities',
    description: 'Neighborhood groups, local meetups, and geographic communities',
    icon: '📍',
    color: 'bg-red-500'
  },
  {
    id: 'parenting',
    name: 'Parenting & Family',
    description: 'Parent support, childcare, family activities, and parenting resources',
    icon: '👨‍👩‍👧‍👦',
    color: 'bg-yellow-500'
  }
];

// Default community roles
const DEFAULT_COMMUNITY_ROLES: CommunityRole[] = [
  {
    id: 'owner',
    name: 'Community Owner',
    type: 'owner',
    icon: '👑',
    description: 'Full control over community settings and management',
    isDefault: false
  },
  {
    id: 'moderator',
    name: 'Moderator',
    type: 'moderator',
    icon: '🛡️',
    description: 'Can moderate content and manage members',
    isDefault: false
  },
  {
    id: 'member',
    name: 'Member',
    type: 'member',
    icon: '👤',
    description: 'Regular community participant',
    isDefault: true
  },
  {
    id: 'guest',
    name: 'Guest',
    type: 'guest',
    icon: '👋',
    description: 'Limited access to community features',
    isDefault: false
  }
];

export const useCommunityStore = create<CommunityState>((set, get) => ({
  communities: [],
  userCommunities: [],
  currentCommunity: null,
  communityMembers: [],
  communityPosts: [],
  communityEvents: [],
  joinRequests: [],
  categories: DEFAULT_CATEGORIES,
  loading: false,
  error: null,

  fetchCommunities: async (filters?: CommunityFilters) => {
    try {
      set({ loading: true, error: null });

      // Use simple query to avoid index requirements
      const q = query(
        collection(db, 'communities'),
        where('isActive', '==', true),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const communities: Community[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
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

      // Apply client-side filters and sorting
      let filteredCommunities = communities;

      // Apply filters if provided
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

      if (filters?.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        filteredCommunities = filteredCommunities.filter(community =>
          community.name.toLowerCase().includes(searchLower) ||
          community.description.toLowerCase().includes(searchLower) ||
          community.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      if (filters?.tags && filters.tags.length > 0) {
        filteredCommunities = filteredCommunities.filter(community =>
          filters.tags!.some(tag => community.tags.includes(tag))
        );
      }

      // Sort by last activity (client-side)
      filteredCommunities.sort((a, b) => 
        b.lastActivity.getTime() - a.lastActivity.getTime()
      );

      set({ communities: filteredCommunities });
    } catch (error: any) {
      console.error('Error fetching communities:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchUserCommunities: async () => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        set({ userCommunities: [] });
        return;
      }

      // Fetch user's community memberships
      const membershipsQuery = query(
        collection(db, 'communityMembers'),
        where('userId', '==', currentUser.uid),
        where('isActive', '==', true)
      );

      const membershipsSnapshot = await getDocs(membershipsQuery);
      const communityIds: string[] = [];

      membershipsSnapshot.forEach((doc) => {
        const data = doc.data();
        communityIds.push(data.communityId);
      });

      if (communityIds.length === 0) {
        set({ userCommunities: [] });
        return;
      }

      // Fetch the actual communities
      // Note: In a production app, you'd want to batch this differently for large numbers
      const userCommunities: Community[] = [];
      
      for (const communityId of communityIds) {
        const communityDoc = await getDoc(doc(db, 'communities', communityId));
        if (communityDoc.exists()) {
          const data = communityDoc.data();
          userCommunities.push({
            id: communityDoc.id,
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
      }

      set({ userCommunities });
    } catch (error: any) {
      console.error('Error fetching user communities:', error);
      set({ error: error.message });
    }
  },

  fetchCommunity: async (communityId: string) => {
    try {
      set({ loading: true, error: null });

      const communityDoc = await getDoc(doc(db, 'communities', communityId));
      
      if (communityDoc.exists()) {
        const data = communityDoc.data();
        const community: Community = {
          id: communityDoc.id,
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

        set({ currentCommunity: community });
        
        // Also fetch members and posts
        await get().fetchCommunityMembers(communityId);
        await get().fetchCommunityPosts(communityId);
      } else {
        set({ currentCommunity: null });
      }
    } catch (error: any) {
      console.error('Error fetching community:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  createCommunity: async (communityData) => {
    try {
      set({ loading: true, error: null });

      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to create a community');
      }

      // Filter out undefined values to avoid Firebase errors
      const cleanCommunityData = Object.fromEntries(
        Object.entries(communityData).filter(([_, value]) => value !== undefined)
      );

      // Create community document
      const communityDocData = {
        ...cleanCommunityData,
        createdBy: currentUser.uid,
        moderators: [currentUser.uid],
        memberCount: 1,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        isActive: true
      };

      const communityDocRef = await addDoc(collection(db, 'communities'), communityDocData);

      // Create initial community member record for creator
      const creatorMember: Omit<CommunityMember, 'id'> = {
        communityId: communityDocRef.id,
        userId: currentUser.uid,
        userName: currentUser.name,
        userEmail: currentUser.email,
        role: DEFAULT_COMMUNITY_ROLES.find(r => r.id === 'owner') || DEFAULT_COMMUNITY_ROLES[0],
        joinedAt: new Date(),
        isActive: true,
        permissions: {
          canInviteMembers: true,
          canModerateContent: true,
          canCreateEvents: true,
          canManageCommunity: true,
          canBanMembers: true
        }
      };

      await addDoc(collection(db, 'communityMembers'), {
        ...creatorMember,
        joinedAt: serverTimestamp()
      });

      console.log('Community created with ID:', communityDocRef.id);
      
      // Refresh user communities
      await get().fetchUserCommunities();

      return communityDocRef.id;
    } catch (error: any) {
      console.error('Error creating community:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  joinCommunity: async (communityId: string, message?: string) => {
    try {
      set({ loading: true, error: null });

      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to join a community');
      }

      // Check if user is already a member
      const existingMemberQuery = query(
        collection(db, 'communityMembers'),
        where('communityId', '==', communityId),
        where('userId', '==', currentUser.uid),
        where('isActive', '==', true)
      );

      const existingMemberSnapshot = await getDocs(existingMemberQuery);
      if (!existingMemberSnapshot.empty) {
        throw new Error('You are already a member of this community');
      }

      // Get community details
      const communityDoc = await getDoc(doc(db, 'communities', communityId));
      if (!communityDoc.exists()) {
        throw new Error('Community not found');
      }

      const communityData = communityDoc.data();

      // For public communities, join directly. For private, create join request
      if (communityData.isPublic) {
        // Create community member record
        const memberData: Omit<CommunityMember, 'id'> = {
          communityId,
          userId: currentUser.uid,
          userName: currentUser.name,
          userEmail: currentUser.email,
          role: DEFAULT_COMMUNITY_ROLES.find(r => r.id === 'member') || DEFAULT_COMMUNITY_ROLES[2],
          joinedAt: new Date(),
          isActive: true,
          permissions: {
            canInviteMembers: false,
            canModerateContent: false,
            canCreateEvents: true,
            canManageCommunity: false,
            canBanMembers: false
          }
        };

        await addDoc(collection(db, 'communityMembers'), {
          ...memberData,
          joinedAt: serverTimestamp()
        });

        // Update member count
        await updateDoc(doc(db, 'communities', communityId), {
          memberCount: (communityData.memberCount || 0) + 1,
          lastActivity: serverTimestamp()
        });

        console.log('Successfully joined community:', communityId);
      } else {
        // Create join request for private community
        await get().sendJoinRequest('community', communityId, message);
      }

      // Refresh user communities
      await get().fetchUserCommunities();
    } catch (error: any) {
      console.error('Error joining community:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  leaveCommunity: async (communityId: string) => {
    try {
      set({ loading: true, error: null });

      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to leave a community');
      }

      // Find and deactivate community member record
      const memberQuery = query(
        collection(db, 'communityMembers'),
        where('communityId', '==', communityId),
        where('userId', '==', currentUser.uid),
        where('isActive', '==', true)
      );

      const memberSnapshot = await getDocs(memberQuery);
      if (!memberSnapshot.empty) {
        const memberDoc = memberSnapshot.docs[0];
        await updateDoc(memberDoc.ref, { isActive: false });
      }

      // Update member count
      const communityDoc = await getDoc(doc(db, 'communities', communityId));
      if (communityDoc.exists()) {
        const data = communityDoc.data();
        await updateDoc(doc(db, 'communities', communityId), {
          memberCount: Math.max(0, (data.memberCount || 1) - 1),
          lastActivity: serverTimestamp()
        });
      }

      console.log('Successfully left community:', communityId);
      
      // Refresh user communities
      await get().fetchUserCommunities();
    } catch (error: any) {
      console.error('Error leaving community:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  sendJoinRequest: async (targetType: 'family' | 'community', targetId: string, message?: string) => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to send join requests');
      }

      // Get target name
      let targetName = '';
      if (targetType === 'community') {
        const communityDoc = await getDoc(doc(db, 'communities', targetId));
        targetName = communityDoc.exists() ? communityDoc.data().name : 'Unknown Community';
      } else {
        const familyDoc = await getDoc(doc(db, 'families', targetId));
        targetName = familyDoc.exists() ? familyDoc.data().name : 'Unknown Family';
      }

      const requestData: Omit<JoinRequest, 'id'> = {
        targetType,
        targetId,
        targetName,
        fromUserId: currentUser.uid,
        fromUserName: currentUser.name,
        fromUserEmail: currentUser.email,
        message: message || '',
        status: 'pending',
        createdAt: new Date()
      };

      await addDoc(collection(db, 'joinRequests'), {
        ...requestData,
        createdAt: serverTimestamp()
      });

      console.log(`Join request sent to ${targetType}:`, targetId);
    } catch (error: any) {
      console.error('Error sending join request:', error);
      set({ error: error.message });
      throw error;
    }
  },

  handleJoinRequest: async (requestId: string, action: 'accept' | 'decline') => {
    try {
      // Implementation for handling join requests
      // This would be used by community/family moderators
      await updateDoc(doc(db, 'joinRequests', requestId), {
        status: action === 'accept' ? 'accepted' : 'declined',
        decidedAt: serverTimestamp()
      });

      console.log(`Join request ${action}ed:`, requestId);
    } catch (error: any) {
      console.error('Error handling join request:', error);
      set({ error: error.message });
      throw error;
    }
  },

  fetchCommunityMembers: async (communityId: string) => {
    try {
      const q = query(
        collection(db, 'communityMembers'),
        where('communityId', '==', communityId),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const members: CommunityMember[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        members.push({
          id: doc.id,
          communityId: data.communityId,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          role: data.role,
          joinedAt: data.joinedAt?.toDate() || new Date(),
          isActive: data.isActive,
          permissions: data.permissions || {
            canInviteMembers: false,
            canModerateContent: false,
            canCreateEvents: false,
            canManageCommunity: false,
            canBanMembers: false
          }
        });
      });

      set({ communityMembers: members });
    } catch (error: any) {
      console.error('Error fetching community members:', error);
      set({ error: error.message });
    }
  },

  updateMemberRole: async (memberId: string, newRole: CommunityRole) => {
    try {
      await updateDoc(doc(db, 'communityMembers', memberId), {
        role: newRole
      });

      // Refresh community members
      const { currentCommunity } = get();
      if (currentCommunity) {
        await get().fetchCommunityMembers(currentCommunity.id);
      }
    } catch (error: any) {
      console.error('Error updating member role:', error);
      set({ error: error.message });
      throw error;
    }
  },

  createCommunityPost: async (communityId: string, content: string, type: CommunityPost['type'], tags: string[] = []) => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to create posts');
      }

      const postData = {
        communityId,
        fromUid: currentUser.uid,
        content,
        type,
        tags,
        reactions: {},
        userReactions: {},
        comments: [],
        isPinned: false,
        isModerated: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'communityPosts'), postData);

      // Update community last activity
      await updateDoc(doc(db, 'communities', communityId), {
        lastActivity: serverTimestamp()
      });

      // Refresh posts
      await get().fetchCommunityPosts(communityId);
    } catch (error: any) {
      console.error('Error creating community post:', error);
      set({ error: error.message });
      throw error;
    }
  },

  fetchCommunityPosts: async (communityId: string) => {
    try {
      const q = query(
        collection(db, 'communityPosts'),
        where('communityId', '==', communityId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const posts: CommunityPost[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
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
        });
      });

      set({ communityPosts: posts });
    } catch (error: any) {
      console.error('Error fetching community posts:', error);
      set({ error: error.message });
    }
  },

  createCommunityEvent: async (eventData) => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to create events');
      }

      // Filter out undefined values to avoid Firebase errors
      const cleanEventData = Object.fromEntries(
        Object.entries(eventData).filter(([_, value]) => value !== undefined)
      );

      await addDoc(collection(db, 'communityEvents'), {
        ...cleanEventData,
        attendees: [],
        createdAt: serverTimestamp()
      });

      console.log('Community event created');
      
      // Refresh events if viewing a specific community
      if (eventData.communityId) {
        await get().fetchCommunityEvents(eventData.communityId);
      }
    } catch (error: any) {
      console.error('Error creating community event:', error);
      set({ error: error.message });
      throw error;
    }
  },

  fetchCommunityEvents: async (communityId?: string) => {
    try {
      // Use simple query to avoid index requirements
      let q = query(
        collection(db, 'communityEvents'),
        limit(50)
      );

      if (communityId) {
        q = query(
          collection(db, 'communityEvents'),
          where('communityId', '==', communityId),
          limit(50)
        );
      }

      const querySnapshot = await getDocs(q);
      const events: CommunityEvent[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        events.push({
          id: doc.id,
          communityId: data.communityId,
          familyId: data.familyId,
          title: data.title,
          description: data.description,
          type: data.type,
          location: data.location,
          dateTime: data.dateTime?.toDate() || new Date(),
          endDateTime: data.endDateTime?.toDate(),
          maxAttendees: data.maxAttendees,
          attendees: data.attendees || [],
          isPublic: data.isPublic,
          requirements: data.requirements,
          tags: data.tags || [],
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate() || new Date(),
          rsvpDeadline: data.rsvpDeadline?.toDate()
        });
      });

      // Sort events by dateTime (client-side)
      events.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

      set({ communityEvents: events });
    } catch (error: any) {
      console.error('Error fetching community events:', error);
      set({ error: error.message });
    }
  },

  rsvpToEvent: async (eventId: string, attending: boolean) => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to RSVP to events');
      }

      const eventDoc = await getDoc(doc(db, 'communityEvents', eventId));
      if (eventDoc.exists()) {
        const data = eventDoc.data();
        let attendees = data.attendees || [];

        if (attending && !attendees.includes(currentUser.uid)) {
          attendees.push(currentUser.uid);
        } else if (!attending && attendees.includes(currentUser.uid)) {
          attendees = attendees.filter((uid: string) => uid !== currentUser.uid);
        }

        await updateDoc(doc(db, 'communityEvents', eventId), {
          attendees
        });

        // Refresh events
        await get().fetchCommunityEvents();
      }
    } catch (error: any) {
      console.error('Error RSVPing to event:', error);
      set({ error: error.message });
      throw error;
    }
  }
}));
