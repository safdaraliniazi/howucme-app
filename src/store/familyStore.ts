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
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Family, FamilyMember, FamilyRole, FamilyInvitation, FamilyEvent, FamilyRitual, FamilyPost } from '@/types';

interface FamilyState {
  currentFamily: Family | null;
  familyMembers: FamilyMember[];
  familyInvitations: FamilyInvitation[];
  familyEvents: FamilyEvent[];
  familyRituals: FamilyRitual[];
  familyPosts: FamilyPost[];
  availableRoles: FamilyRole[];
  loading: boolean;
  error: string | null;
  
  // Actions
  createFamily: (familyData: Omit<Family, 'id' | 'createdAt' | 'memberCount' | 'createdBy'>) => Promise<string>;
  joinFamily: (familyId: string) => Promise<void>;
  leaveFamily: () => Promise<void>;
  fetchFamily: (familyId?: string) => Promise<void>;
  fetchFamilyMembers: (familyId?: string) => Promise<void>;
  inviteMember: (email: string, proposedRole: FamilyRole, message?: string) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  updateMemberRole: (memberId: string, newRole: FamilyRole, customTitle?: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  createEvent: (eventData: Omit<FamilyEvent, 'id' | 'createdAt'>) => Promise<void>;
  createRitual: (ritualData: Omit<FamilyRitual, 'id' | 'createdAt'>) => Promise<void>;
  createFamilyPost: (content: string, type: FamilyPost['type'], isPrivate?: boolean) => Promise<void>;
  fetchFamilyPosts: (familyId?: string) => Promise<void>;
  generateInviteCode: () => Promise<string>;
  joinByInviteCode: (inviteCode: string) => Promise<void>;
}

// Default family roles
const DEFAULT_FAMILY_ROLES: FamilyRole[] = [
  {
    id: 'parent',
    name: 'Parent Figure',
    type: 'parent',
    icon: '👑',
    description: 'Loving guide and supporter',
    isDefault: true
  },
  {
    id: 'sibling',
    name: 'Sibling',
    type: 'sibling',
    icon: '🤝',
    description: 'Close companion and friend',
    isDefault: true
  },
  {
    id: 'aunt-uncle',
    name: 'Aunt/Uncle',
    type: 'extended',
    icon: '🌟',
    description: 'Wise mentor and supporter',
    isDefault: true
  },
  {
    id: 'grandparent',
    name: 'Grandparent',
    type: 'extended',
    icon: '🧓',
    description: 'Elder wisdom and love',
    isDefault: true
  },
  {
    id: 'cousin',
    name: 'Cousin',
    type: 'extended',
    icon: '👥',
    description: 'Fun companion and ally',
    isDefault: true
  },
  {
    id: 'custom',
    name: 'Custom Role',
    type: 'custom',
    icon: '⭐',
    description: 'Create your own unique role',
    isDefault: false
  }
];

export const useFamilyStore = create<FamilyState>((set, get) => ({
  currentFamily: null,
  familyMembers: [],
  familyInvitations: [],
  familyEvents: [],
  familyRituals: [],
  familyPosts: [],
  availableRoles: DEFAULT_FAMILY_ROLES,
  loading: false,
  error: null,

  createFamily: async (familyData) => {
    try {
      set({ loading: true, error: null });

      // Get current user
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to create a family');
      }

      // Create family document
      const familyDocData: any = {
        name: familyData.name,
        description: familyData.description,
        motto: familyData.motto,
        values: familyData.values || [],
        isPublic: familyData.isPublic || false,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        memberCount: 1
      };

      // Only add optional fields if they have values
      if (familyData.maxMembers) {
        familyDocData.maxMembers = familyData.maxMembers;
      }
      if (familyData.crestUrl) {
        familyDocData.crestUrl = familyData.crestUrl;
      }

      const familyDocRef = await addDoc(collection(db, 'families'), familyDocData);
      console.log('Family created with ID:', familyDocRef.id);

      // Create initial family member record for creator
      const creatorMember: Omit<FamilyMember, 'id'> = {
        familyId: familyDocRef.id,
        userId: currentUser.uid,
        userName: currentUser.name,
        userEmail: currentUser.email,
        role: DEFAULT_FAMILY_ROLES.find(r => r.id === 'parent') || DEFAULT_FAMILY_ROLES[0],
        joinedAt: new Date(),
        invitedBy: currentUser.uid,
        isActive: true,
        permissions: {
          canInviteMembers: true,
          canManageRoles: true,
          canCreateEvents: true,
          canModerateContent: true,
          canManageFamily: true
        }
      };

      await addDoc(collection(db, 'familyMembers'), {
        ...creatorMember,
        joinedAt: serverTimestamp()
      });

      // Update user's familyId
      await updateDoc(doc(db, 'users', currentUser.uid), {
        familyId: familyDocRef.id
      });

      // Update auth store
      useAuthStore.setState({
        appUser: { ...currentUser, familyId: familyDocRef.id }
      });

      // Fetch the created family
      await get().fetchFamily(familyDocRef.id);

      return familyDocRef.id;
    } catch (error: any) {
      console.error('Error creating family:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchFamily: async (familyId?: string) => {
    try {
      set({ loading: true, error: null });

      // Get current user's family ID if not provided
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      const targetFamilyId = familyId || currentUser?.familyId;
      
      if (!targetFamilyId) {
        set({ currentFamily: null, loading: false });
        return;
      }

      const familyDoc = await getDoc(doc(db, 'families', targetFamilyId));
      
      if (familyDoc.exists()) {
        const familyData = familyDoc.data();
        const family: Family = {
          id: familyDoc.id,
          name: familyData.name,
          description: familyData.description,
          motto: familyData.motto,
          values: familyData.values || [],
          crestUrl: familyData.crestUrl,
          createdBy: familyData.createdBy,
          createdAt: familyData.createdAt?.toDate() || new Date(),
          isPublic: familyData.isPublic || false,
          inviteCode: familyData.inviteCode,
          memberCount: familyData.memberCount || 0,
          maxMembers: familyData.maxMembers,
          members: [], // Will be populated by fetchFamilyMembers
          rituals: familyData.rituals || []
        };

        set({ currentFamily: family });
        
        // Also fetch family members
        await get().fetchFamilyMembers(targetFamilyId);
      } else {
        set({ currentFamily: null });
      }
    } catch (error: any) {
      console.error('Error fetching family:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchFamilyMembers: async (familyId?: string) => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      const targetFamilyId = familyId || currentUser?.familyId;
      
      if (!targetFamilyId) {
        set({ familyMembers: [] });
        return;
      }

      const q = query(
        collection(db, 'familyMembers'),
        where('familyId', '==', targetFamilyId),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const members: FamilyMember[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        members.push({
          id: doc.id,
          familyId: data.familyId,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          role: data.role,
          customTitle: data.customTitle,
          joinedAt: data.joinedAt?.toDate() || new Date(),
          invitedBy: data.invitedBy,
          isActive: data.isActive,
          permissions: data.permissions || {
            canInviteMembers: false,
            canManageRoles: false,
            canCreateEvents: false,
            canModerateContent: false,
            canManageFamily: false
          }
        });
      });

      set({ familyMembers: members });
      console.log('Family members fetched:', members.length);
    } catch (error: any) {
      console.error('Error fetching family members:', error);
      set({ error: error.message });
    }
  },

  inviteMember: async (email: string, proposedRole: FamilyRole, message?: string) => {
    try {
      set({ loading: true, error: null });

      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      const { currentFamily } = get();
      
      if (!currentUser || !currentFamily) {
        throw new Error('Must be logged in and part of a family to invite members');
      }

      // Check if user exists
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        throw new Error('User with this email does not exist');
      }

      const targetUser = usersSnapshot.docs[0].data();
      
      // Check if user is already in a family
      if (targetUser.familyId) {
        throw new Error('User is already part of a family');
      }

      // Create invitation
      const invitationData = {
        familyId: currentFamily.id,
        familyName: currentFamily.name,
        fromUserId: currentUser.uid,
        fromUserName: currentUser.name,
        toUserId: targetUser.uid,
        toEmail: email,
        proposedRole,
        message: message || '',
        status: 'pending' as const,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      await addDoc(collection(db, 'familyInvitations'), invitationData);
      console.log('Family invitation sent to:', email);
    } catch (error: any) {
      console.error('Error sending family invitation:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  joinFamily: async (familyId: string) => {
    try {
      set({ loading: true, error: null });

      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to join a family');
      }

      if (currentUser.familyId) {
        throw new Error('You are already part of a family');
      }

      // Create family member record
      const memberData: Omit<FamilyMember, 'id'> = {
        familyId,
        userId: currentUser.uid,
        userName: currentUser.name,
        userEmail: currentUser.email,
        role: DEFAULT_FAMILY_ROLES.find(r => r.id === 'sibling') || DEFAULT_FAMILY_ROLES[1],
        joinedAt: new Date(),
        invitedBy: currentUser.uid, // Self-join
        isActive: true,
        permissions: {
          canInviteMembers: false,
          canManageRoles: false,
          canCreateEvents: true,
          canModerateContent: false,
          canManageFamily: false
        }
      };

      await addDoc(collection(db, 'familyMembers'), {
        ...memberData,
        joinedAt: serverTimestamp()
      });

      // Update user's familyId
      await updateDoc(doc(db, 'users', currentUser.uid), {
        familyId
      });

      // Update member count
      const familyRef = doc(db, 'families', familyId);
      const familyDoc = await getDoc(familyRef);
      if (familyDoc.exists()) {
        await updateDoc(familyRef, {
          memberCount: (familyDoc.data().memberCount || 0) + 1
        });
      }

      // Update auth store
      useAuthStore.setState({
        appUser: { ...currentUser, familyId }
      });

      // Fetch the family data
      await get().fetchFamily(familyId);

      console.log('Successfully joined family:', familyId);
    } catch (error: any) {
      console.error('Error joining family:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  leaveFamily: async () => {
    try {
      set({ loading: true, error: null });

      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser || !currentUser.familyId) {
        throw new Error('Not part of any family');
      }

      // Find and deactivate family member record
      const membersQuery = query(
        collection(db, 'familyMembers'),
        where('familyId', '==', currentUser.familyId),
        where('userId', '==', currentUser.uid)
      );

      const membersSnapshot = await getDocs(membersQuery);
      if (!membersSnapshot.empty) {
        const memberDoc = membersSnapshot.docs[0];
        await updateDoc(memberDoc.ref, { isActive: false });
      }

      // Update user's familyId
      await updateDoc(doc(db, 'users', currentUser.uid), {
        familyId: null
      });

      // Update member count
      const familyRef = doc(db, 'families', currentUser.familyId);
      const familyDoc = await getDoc(familyRef);
      if (familyDoc.exists()) {
        await updateDoc(familyRef, {
          memberCount: Math.max(0, (familyDoc.data().memberCount || 1) - 1)
        });
      }

      // Update auth store
      useAuthStore.setState({
        appUser: { ...currentUser, familyId: null }
      });

      // Clear family data
      set({ 
        currentFamily: null, 
        familyMembers: [], 
        familyEvents: [], 
        familyPosts: [] 
      });

      console.log('Successfully left family');
    } catch (error: any) {
      console.error('Error leaving family:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  acceptInvitation: async (invitationId: string) => {
    try {
      set({ loading: true, error: null });

      // Update invitation status
      await updateDoc(doc(db, 'familyInvitations', invitationId), {
        status: 'accepted'
      });

      // Get invitation details
      const invitationDoc = await getDoc(doc(db, 'familyInvitations', invitationId));
      if (invitationDoc.exists()) {
        const invitation = invitationDoc.data();
        await get().joinFamily(invitation.familyId);
      }

      console.log('Family invitation accepted');
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  declineInvitation: async (invitationId: string) => {
    try {
      await updateDoc(doc(db, 'familyInvitations', invitationId), {
        status: 'declined'
      });

      console.log('Family invitation declined');
    } catch (error: any) {
      console.error('Error declining invitation:', error);
      set({ error: error.message });
      throw error;
    }
  },

  updateMemberRole: async (memberId: string, newRole: FamilyRole, customTitle?: string) => {
    try {
      set({ loading: true, error: null });

      const updateData: any = { role: newRole };
      if (customTitle) {
        updateData.customTitle = customTitle;
      }

      await updateDoc(doc(db, 'familyMembers', memberId), updateData);

      // Refresh family members
      await get().fetchFamilyMembers();

      console.log('Member role updated');
    } catch (error: any) {
      console.error('Error updating member role:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  removeMember: async (memberId: string) => {
    try {
      set({ loading: true, error: null });

      await updateDoc(doc(db, 'familyMembers', memberId), {
        isActive: false
      });

      // Refresh family members
      await get().fetchFamilyMembers();

      console.log('Member removed from family');
    } catch (error: any) {
      console.error('Error removing member:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createEvent: async (eventData) => {
    try {
      set({ loading: true, error: null });

      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to create events');
      }

      await addDoc(collection(db, 'familyEvents'), {
        ...eventData,
        createdAt: serverTimestamp()
      });

      console.log('Family event created');
    } catch (error: any) {
      console.error('Error creating family event:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createRitual: async (ritualData) => {
    try {
      set({ loading: true, error: null });

      await addDoc(collection(db, 'familyRituals'), {
        ...ritualData,
        createdAt: serverTimestamp()
      });

      console.log('Family ritual created');
    } catch (error: any) {
      console.error('Error creating family ritual:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createFamilyPost: async (content: string, type: FamilyPost['type'], isPrivate = false) => {
    try {
      set({ loading: true, error: null });

      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      const { currentFamily } = get();
      
      if (!currentUser || !currentFamily) {
        throw new Error('Must be logged in and part of a family to post');
      }

      const postData = {
        familyId: currentFamily.id,
        fromUid: currentUser.uid,
        content,
        type,
        reactions: {},
        userReactions: {},
        isPrivate,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'familyPosts'), postData);

      // Refresh family posts
      await get().fetchFamilyPosts();

      console.log('Family post created');
    } catch (error: any) {
      console.error('Error creating family post:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchFamilyPosts: async (familyId?: string) => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      const targetFamilyId = familyId || currentUser?.familyId;
      
      if (!targetFamilyId) {
        set({ familyPosts: [] });
        return;
      }

      const q = query(
        collection(db, 'familyPosts'),
        where('familyId', '==', targetFamilyId),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const posts: FamilyPost[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          familyId: data.familyId,
          fromUid: data.fromUid,
          content: data.content,
          type: data.type,
          attachments: data.attachments,
          reactions: data.reactions || {},
          userReactions: data.userReactions || {},
          comments: data.comments || [],
          isPrivate: data.isPrivate || false,
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });

      // Sort by creation date (newest first)
      posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      set({ familyPosts: posts });
      console.log('Family posts fetched:', posts.length);
    } catch (error: any) {
      console.error('Error fetching family posts:', error);
      set({ error: error.message });
    }
  },

  generateInviteCode: async () => {
    try {
      const { currentFamily } = get();
      if (!currentFamily) {
        throw new Error('Not part of any family');
      }

      const inviteCode = Math.random().toString(36).substring(2, 15);
      
      await updateDoc(doc(db, 'families', currentFamily.id), {
        inviteCode
      });

      // Update local state
      set({
        currentFamily: {
          ...currentFamily,
          inviteCode
        }
      });

      return inviteCode;
    } catch (error: any) {
      console.error('Error generating invite code:', error);
      set({ error: error.message });
      throw error;
    }
  },

  joinByInviteCode: async (inviteCode: string) => {
    try {
      set({ loading: true, error: null });

      // Find family by invite code
      const familiesQuery = query(
        collection(db, 'families'),
        where('inviteCode', '==', inviteCode)
      );

      const familiesSnapshot = await getDocs(familiesQuery);
      
      if (familiesSnapshot.empty) {
        throw new Error('Invalid invite code');
      }

      const familyDoc = familiesSnapshot.docs[0];
      await get().joinFamily(familyDoc.id);

      console.log('Successfully joined family via invite code');
    } catch (error: any) {
      console.error('Error joining family by invite code:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));
