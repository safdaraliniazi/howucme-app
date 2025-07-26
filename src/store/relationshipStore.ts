import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  onSnapshot,
  or,
  and
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Relationship, AppUser } from '@/types';

interface RelationshipState {
  relationships: Relationship[];
  pendingRequests: Relationship[];
  users: (AppUser & { relationshipStatus?: string, relationshipLabel?: string })[];
  loading: boolean;
  error: string | null;
  
  // Actions
  sendRelationshipRequest: (toUserId: string, label: string) => Promise<void>;
  acceptRequest: (relationshipId: string) => Promise<void>;
  rejectRequest: (relationshipId: string) => Promise<void>;
  blockUser: (relationshipId: string) => Promise<void>;
  fetchRelationships: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  searchUsers: (searchTerm: string) => Promise<void>;
  subscribeToRelationships: () => () => void;
}

export const useRelationshipStore = create<RelationshipState>((set, get) => ({
  relationships: [],
  pendingRequests: [],
  users: [],
  loading: false,
  error: null,

  sendRelationshipRequest: async (toUserId: string, label: string) => {
    try {
      set({ loading: true, error: null });

      // Get current user
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to send relationship requests');
      }

      if (currentUser.uid === toUserId) {
        throw new Error('Cannot send relationship request to yourself');
      }

      // Check if relationship already exists (simplified to avoid index issues)
      const allRelationshipsQuery = query(collection(db, 'relationships'));
      const existingSnapshot = await getDocs(allRelationshipsQuery);
      
      let relationshipExists = false;
      existingSnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          (data.from === currentUser.uid && data.to === toUserId) ||
          (data.from === toUserId && data.to === currentUser.uid)
        ) {
          relationshipExists = true;
        }
      });

      if (relationshipExists) {
        throw new Error('Relationship request already exists or you are already connected');
      }

      // Get the target user's name
      const targetUserQuery = query(
        collection(db, 'users'),
        where('uid', '==', toUserId)
      );
      const targetUserSnapshot = await getDocs(targetUserQuery);
      let toUserName = 'Unknown User';
      
      if (!targetUserSnapshot.empty) {
        const targetUserData = targetUserSnapshot.docs[0].data();
        toUserName = targetUserData.name || 'Unknown User';
      }

      const relationshipData = {
        from: currentUser.uid,
        to: toUserId,
        label: label,
        status: 'pending',
        createdAt: serverTimestamp(),
        fromUserName: currentUser.name,
        toUserName: toUserName,
      };

      console.log('Sending relationship request...');
      const docRef = await addDoc(collection(db, 'relationships'), relationshipData);
      console.log('Relationship request sent successfully:', docRef.id);

      // Refresh data
      await get().fetchPendingRequests();
    } catch (error: any) {
      console.error('Error sending relationship request:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  acceptRequest: async (relationshipId: string) => {
    try {
      set({ loading: true, error: null });

      // Get current user
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to accept requests');
      }

      const relationshipRef = doc(db, 'relationships', relationshipId);
      await updateDoc(relationshipRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        toUserName: currentUser.name, // Add current user's name as toUserName
      });

      console.log('Relationship request accepted');
      
      // Refresh both relationships and pending requests
      await Promise.all([
        get().fetchRelationships(),
        get().fetchPendingRequests()
      ]);

      // Check for achievement unlocks after accepting a relationship
      try {
        const { useAchievementStore } = await import('./achievementStore');
        await useAchievementStore.getState().checkAndUnlockAchievements();
        console.log('Achievement check completed after relationship accepted');
      } catch (achievementError) {
        console.error('Error checking achievements after relationship accepted:', achievementError);
        // Don't throw here - relationship acceptance should still succeed
      }
    } catch (error: any) {
      console.error('Error accepting relationship request:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  rejectRequest: async (relationshipId: string) => {
    try {
      set({ loading: true, error: null });

      const relationshipRef = doc(db, 'relationships', relationshipId);
      await updateDoc(relationshipRef, {
        status: 'rejected',
      });

      console.log('Relationship request rejected');
      await get().fetchPendingRequests();
    } catch (error: any) {
      console.error('Error rejecting relationship request:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  blockUser: async (relationshipId: string) => {
    try {
      set({ loading: true, error: null });

      const relationshipRef = doc(db, 'relationships', relationshipId);
      await updateDoc(relationshipRef, {
        status: 'blocked',
      });

      console.log('User blocked');
      await Promise.all([
        get().fetchRelationships(),
        get().fetchPendingRequests()
      ]);
    } catch (error: any) {
      console.error('Error blocking user:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchRelationships: async () => {
    try {
      set({ loading: true, error: null });

      // Get current user
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        set({ relationships: [], loading: false });
        return;
      }

      // Fetch all accepted relationships (simple query)
      const q = query(
        collection(db, 'relationships'),
        where('status', '==', 'accepted')
      );

      const querySnapshot = await getDocs(q);
      const relationships: Relationship[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include relationships where current user is involved
        if (data.from === currentUser.uid || data.to === currentUser.uid) {
          console.log('Relationship data:', {
            id: doc.id,
            from: data.from,
            to: data.to,
            fromUserName: data.fromUserName,
            toUserName: data.toUserName,
            currentUser: currentUser.uid
          });
          
          relationships.push({
            id: doc.id,
            from: data.from,
            to: data.to,
            label: data.label,
            status: data.status,
            createdAt: data.createdAt?.toDate() || new Date(),
            acceptedAt: data.acceptedAt?.toDate(),
            fromUserName: data.fromUserName,
            toUserName: data.toUserName,
          });
        }
      });

      // Sort by acceptedAt locally
      relationships.sort((a, b) => {
        const aTime = a.acceptedAt?.getTime() || 0;
        const bTime = b.acceptedAt?.getTime() || 0;
        return bTime - aTime;
      });

      set({ relationships, loading: false });
      console.log('Relationships fetched successfully:', relationships.length);
    } catch (error: any) {
      console.error('Error fetching relationships:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchPendingRequests: async () => {
    try {
      // Get current user
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        set({ pendingRequests: [] });
        return;
      }

      // Fetch pending requests directed to current user (simple query)
      const q = query(
        collection(db, 'relationships'),
        where('to', '==', currentUser.uid),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(q);
      const pendingRequests: Relationship[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        pendingRequests.push({
          id: doc.id,
          from: data.from,
          to: data.to,
          label: data.label,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          fromUserName: data.fromUserName,
          toUserName: data.toUserName,
        });
      });

      // Sort by createdAt locally
      pendingRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      set({ pendingRequests });
      console.log('Pending requests fetched successfully:', pendingRequests.length);
    } catch (error: any) {
      console.error('Error fetching pending requests:', error);
      set({ error: error.message });
    }
  },

  searchUsers: async (searchTerm: string) => {
    try {
      set({ loading: true, error: null });

      if (!searchTerm.trim()) {
        set({ users: [], loading: false });
        return;
      }

      // Get current user
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        set({ users: [], loading: false });
        return;
      }

      // First, get all relationships for current user to check existing connections
      const relationshipsQuery = query(collection(db, 'relationships'));
      const relationshipsSnapshot = await getDocs(relationshipsQuery);
      const existingRelationships = new Map<string, { status: string, label: string }>();

      relationshipsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.from === currentUser.uid) {
          existingRelationships.set(data.to, { status: data.status, label: data.label });
        } else if (data.to === currentUser.uid) {
          existingRelationships.set(data.from, { status: data.status, label: data.label });
        }
      });

      // Simple search without orderBy to avoid index requirements
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const users: (AppUser & { relationshipStatus?: string, relationshipLabel?: string })[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const userName = data.name?.toLowerCase() || '';
        const userEmail = data.email?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();

        // Filter results client-side and exclude current user
        if (
          data.uid !== currentUser.uid &&
          (userName.includes(search) || userEmail.includes(search))
        ) {
          const relationship = existingRelationships.get(data.uid);
          
          users.push({
            uid: data.uid,
            name: data.name,
            email: data.email,
            bio: data.bio,
            profilePicUrl: data.profilePicUrl,
            familyId: data.familyId,
            relationships: data.relationships || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            relationshipStatus: relationship?.status,
            relationshipLabel: relationship?.label,
          });
        }
      });

      set({ users: users.slice(0, 20), loading: false }); // Limit to 20 results
      console.log('User search completed:', users.length, 'results');
    } catch (error: any) {
      console.error('Error searching users:', error);
      set({ error: error.message, loading: false });
    }
  },

  subscribeToRelationships: () => {
    // Get current user
    const { useAuthStore } = require('./authStore');
    const currentUser = useAuthStore.getState().appUser;
    
    if (!currentUser) {
      return () => {};
    }

    // Simple subscription without complex ordering
    const q = query(
      collection(db, 'relationships')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const relationships: Relationship[] = [];
      const pendingRequests: Relationship[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Only process relationships involving current user
        if (data.from === currentUser.uid || data.to === currentUser.uid) {
          const relationship: Relationship = {
            id: doc.id,
            from: data.from,
            to: data.to,
            label: data.label,
            status: data.status,
            createdAt: data.createdAt?.toDate() || new Date(),
            acceptedAt: data.acceptedAt?.toDate(),
            fromUserName: data.fromUserName,
            toUserName: data.toUserName,
          };

          if (data.status === 'accepted') {
            relationships.push(relationship);
          } else if (data.status === 'pending' && data.to === currentUser.uid) {
            pendingRequests.push(relationship);
          }
        }
      });

      // Sort locally
      relationships.sort((a, b) => {
        const aTime = a.acceptedAt?.getTime() || 0;
        const bTime = b.acceptedAt?.getTime() || 0;
        return bTime - aTime;
      });

      pendingRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      set({ relationships, pendingRequests });
      console.log('Real-time relationships updated');
    }, (error) => {
      console.error('Error in relationships subscription:', error);
      set({ error: error.message });
    });

    return unsubscribe;
  },
}));
