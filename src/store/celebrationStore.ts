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
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Celebration, Recognition } from '@/types';

interface CelebrationState {
  celebrations: Celebration[];
  recognitions: Recognition[];
  upcomingCelebrations: Celebration[];
  loading: boolean;
  error: string | null;
  
  // Actions
  createCelebration: (celebration: Omit<Celebration, 'id' | 'createdAt'>) => Promise<void>;
  fetchCelebrations: (userId?: string) => Promise<void>;
  fetchUpcomingCelebrations: () => Promise<void>;
  joinCelebration: (celebrationId: string) => Promise<void>;
  
  // Recognition actions
  giveRecognition: (recognition: Omit<Recognition, 'id' | 'createdAt'>) => Promise<void>;
  fetchRecognitions: (userId?: string) => Promise<void>;
  fetchRecognitionsReceived: (userId?: string) => Promise<Recognition[]>;
}

export const useCelebrationStore = create<CelebrationState>((set, get) => ({
  celebrations: [],
  recognitions: [],
  upcomingCelebrations: [],
  loading: false,
  error: null,

  createCelebration: async (celebrationData) => {
    try {
      set({ loading: true, error: null });

      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to create celebrations');
      }

      const celebration = {
        ...celebrationData,
        createdBy: currentUser.uid,
        participants: [currentUser.uid, ...celebrationData.participants],
        createdAt: serverTimestamp(),
      };

      console.log('Creating celebration...');
      const docRef = await addDoc(collection(db, 'celebrations'), celebration);
      console.log('Celebration created successfully:', docRef.id);

      // Refresh celebrations
      await get().fetchCelebrations();
      await get().fetchUpcomingCelebrations();
    } catch (error: any) {
      console.error('Error creating celebration:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchCelebrations: async (userId?: string) => {
    try {
      set({ loading: true, error: null });

      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      const targetUserId = userId || currentUser?.uid;
      
      if (!targetUserId) {
        set({ celebrations: [], loading: false });
        return;
      }

      // Fetch celebrations where user is participant or the celebrated person
      const q = query(
        collection(db, 'celebrations'),
        orderBy('date', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const celebrations: Celebration[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Include if user is participant, creator, or the person being celebrated
        if (
          data.participants?.includes(targetUserId) ||
          data.createdBy === targetUserId ||
          data.userId === targetUserId ||
          data.isPublic
        ) {
          celebrations.push({
            id: doc.id,
            type: data.type,
            title: data.title,
            description: data.description,
            date: data.date?.toDate() || new Date(),
            userId: data.userId,
            createdBy: data.createdBy,
            participants: data.participants || [],
            isPublic: data.isPublic !== false,
            reminderSet: data.reminderSet || false,
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        }
      });

      set({ celebrations, loading: false });
      console.log('Celebrations fetched successfully:', celebrations.length);
    } catch (error: any) {
      console.error('Error fetching celebrations:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchUpcomingCelebrations: async () => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        set({ upcomingCelebrations: [] });
        return;
      }

      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      const q = query(
        collection(db, 'celebrations'),
        orderBy('date', 'asc'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const upcomingCelebrations: Celebration[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const celebrationDate = data.date?.toDate();
        
        // Check if celebration is upcoming and user is involved
        if (
          celebrationDate &&
          celebrationDate >= now &&
          celebrationDate <= thirtyDaysFromNow &&
          (data.participants?.includes(currentUser.uid) ||
           data.createdBy === currentUser.uid ||
           data.userId === currentUser.uid ||
           data.isPublic)
        ) {
          upcomingCelebrations.push({
            id: doc.id,
            type: data.type,
            title: data.title,
            description: data.description,
            date: celebrationDate,
            userId: data.userId,
            createdBy: data.createdBy,
            participants: data.participants || [],
            isPublic: data.isPublic !== false,
            reminderSet: data.reminderSet || false,
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        }
      });

      set({ upcomingCelebrations });
      console.log('Upcoming celebrations fetched:', upcomingCelebrations.length);
    } catch (error: any) {
      console.error('Error fetching upcoming celebrations:', error);
      set({ error: error.message });
    }
  },

  joinCelebration: async (celebrationId: string) => {
    try {
      set({ loading: true, error: null });

      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to join celebrations');
      }

      const celebrations = get().celebrations;
      const celebration = celebrations.find(c => c.id === celebrationId);
      
      if (!celebration) {
        throw new Error('Celebration not found');
      }

      if (celebration.participants.includes(currentUser.uid)) {
        throw new Error('Already participating in this celebration');
      }

      const celebrationRef = doc(db, 'celebrations', celebrationId);
      await updateDoc(celebrationRef, {
        participants: [...celebration.participants, currentUser.uid]
      });

      // Update local state
      set(state => ({
        celebrations: state.celebrations.map(c =>
          c.id === celebrationId
            ? { ...c, participants: [...c.participants, currentUser.uid] }
            : c
        ),
        loading: false
      }));

      console.log('Joined celebration successfully');
    } catch (error: any) {
      console.error('Error joining celebration:', error);
      set({ error: error.message, loading: false });
    }
  },

  giveRecognition: async (recognitionData) => {
    try {
      set({ loading: true, error: null });

      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to give recognition');
      }

      if (recognitionData.toUserId === currentUser.uid) {
        throw new Error('Cannot give recognition to yourself');
      }

      const recognition = {
        ...recognitionData,
        fromUserId: currentUser.uid,
        createdAt: serverTimestamp(),
      };

      console.log('Giving recognition...');
      const docRef = await addDoc(collection(db, 'recognitions'), recognition);
      console.log('Recognition given successfully:', docRef.id);

      // Also create a recognition post if it's public
      if (recognitionData.isPublic) {
        const { usePostStore } = await import('./postStore');
        const postText = `🌟 Recognition: ${recognitionData.message}`;
        
        // Note: We'll need to update postStore to handle recognition posts
        // For now, create a regular post with recognition context
      }

      // Refresh recognitions
      await get().fetchRecognitions();
    } catch (error: any) {
      console.error('Error giving recognition:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchRecognitions: async (userId?: string) => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      const targetUserId = userId || currentUser?.uid;
      
      if (!targetUserId) {
        set({ recognitions: [] });
        return;
      }

      // Fetch recognitions given by or received by the user
      const q = query(
        collection(db, 'recognitions'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const recognitions: Recognition[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Include if user gave or received recognition, or if it's public
        if (
          data.fromUserId === targetUserId ||
          data.toUserId === targetUserId ||
          data.isPublic
        ) {
          recognitions.push({
            id: doc.id,
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            type: data.type,
            message: data.message,
            isPublic: data.isPublic !== false,
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        }
      });

      set({ recognitions });
      console.log('Recognitions fetched successfully:', recognitions.length);
    } catch (error: any) {
      console.error('Error fetching recognitions:', error);
      set({ error: error.message });
    }
  },

  fetchRecognitionsReceived: async (userId?: string): Promise<Recognition[]> => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      const targetUserId = userId || currentUser?.uid;
      
      if (!targetUserId) return [];

      const q = query(
        collection(db, 'recognitions'),
        where('toUserId', '==', targetUserId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const recognitions: Recognition[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        recognitions.push({
          id: doc.id,
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          type: data.type,
          message: data.message,
          isPublic: data.isPublic !== false,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      // Update only recognitions received for the target user
      console.log('Recognitions received fetched:', recognitions.length);
      return recognitions;
    } catch (error: any) {
      console.error('Error fetching recognitions received:', error);
      set({ error: error.message });
      return [];
    }
  },
}));
