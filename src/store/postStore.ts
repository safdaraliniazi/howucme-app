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
  limit,
  where,
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Post } from '@/types';

interface PostState {
  posts: Post[];
  loading: boolean;
  error: string | null;
  
  // Actions
  createPost: (text: string, mediaFile?: undefined, anonymous?: boolean) => Promise<void>;
  fetchPosts: () => Promise<void>;
  reactToPost: (postId: string, reactionType: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  subscribeToFeed: () => () => void; // Returns unsubscribe function
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  loading: false,
  error: null,

  createPost: async (text: string, mediaFile?: undefined, anonymous = false) => {
    try {
      set({ loading: true, error: null });

      // Get current user
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to create posts');
      }

      const postData = {
        fromUid: currentUser.uid,
        text,
        anonymous,
        reactions: {
          heart: 0,
          sparkles: 0,
          clap: 0,
          star: 0,
        },
        userReactions: {},
        createdAt: serverTimestamp(),
      };

      console.log('Creating post...');
      const docRef = await addDoc(collection(db, 'posts'), postData);
      console.log('Post created successfully:', docRef.id);

      // Refresh posts
      get().fetchPosts();

      // Check for achievement unlocks after creating a post
      try {
        const { useAchievementStore } = await import('./achievementStore');
        await useAchievementStore.getState().checkAndUnlockAchievements();
        console.log('Achievement check completed after post creation');
      } catch (achievementError) {
        console.error('Error checking achievements after post creation:', achievementError);
        // Don't throw here - post creation should still succeed even if achievement check fails
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchPosts: async () => {
    try {
      set({ loading: true, error: null });

      const q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const posts: Post[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          fromUid: data.fromUid,
          text: data.text,
          mediaUrl: data.mediaUrl || '',
          anonymous: data.anonymous,
          reactions: data.reactions || { heart: 0, sparkles: 0, clap: 0, star: 0 },
          userReactions: data.userReactions || {},
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      set({ posts, loading: false });
      console.log('Posts fetched successfully:', posts.length);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      set({ error: error.message, loading: false });
    }
  },

  reactToPost: async (postId: string, reactionType: string) => {
    try {
      // Get current user
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to react to posts');
      }

      const postRef = doc(db, 'posts', postId);
      const posts = get().posts;
      const post = posts.find(p => p.id === postId);
      
      if (!post) return;

      const userId = currentUser.uid;
      const currentUserReaction = post.userReactions[userId];
      
      // Create new reaction and userReaction objects
      const newReactions = { ...post.reactions };
      const newUserReactions = { ...post.userReactions };

      // If user already reacted with the same type, remove it (toggle off)
      if (currentUserReaction === reactionType) {
        newReactions[reactionType] = Math.max(0, newReactions[reactionType] - 1);
        delete newUserReactions[userId];
      } 
      // If user had a different reaction, remove old and add new
      else if (currentUserReaction) {
        newReactions[currentUserReaction] = Math.max(0, newReactions[currentUserReaction] - 1);
        newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
        newUserReactions[userId] = reactionType;
      }
      // If user had no reaction, just add the new one
      else {
        newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
        newUserReactions[userId] = reactionType;
      }

      await updateDoc(postRef, {
        reactions: newReactions,
        userReactions: newUserReactions,
      });

      // Update local state
      const updatedPosts = posts.map(p =>
        p.id === postId
          ? { ...p, reactions: newReactions, userReactions: newUserReactions }
          : p
      );

      set({ posts: updatedPosts });
      console.log('Reaction updated successfully');

      // Check for achievement unlocks for the post author (if someone reacted to their post)
      if (post.fromUid !== currentUser.uid) {
        try {
          const { useAchievementStore } = await import('./achievementStore');
          await useAchievementStore.getState().checkAndUnlockAchievements();
          console.log('Achievement check completed after reaction given');
        } catch (achievementError) {
          console.error('Error checking achievements after reaction:', achievementError);
          // Don't throw here - reaction should still succeed
        }
      }
    } catch (error: any) {
      console.error('Error updating reaction:', error);
      set({ error: error.message });
    }
  },

  deletePost: async (postId: string) => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to delete posts');
      }

      const posts = get().posts;
      const post = posts.find(p => p.id === postId);
      
      if (!post || post.fromUid !== currentUser.uid) {
        throw new Error('Can only delete your own posts');
      }

      await deleteDoc(doc(db, 'posts', postId));
      
      // Update local state
      const updatedPosts = posts.filter(p => p.id !== postId);
      set({ posts: updatedPosts });
      
      console.log('Post deleted successfully');
    } catch (error: any) {
      console.error('Error deleting post:', error);
      set({ error: error.message });
    }
  },

  subscribeToFeed: () => {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts: Post[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          fromUid: data.fromUid,
          text: data.text,
          mediaUrl: data.mediaUrl || '',
          anonymous: data.anonymous,
          reactions: data.reactions || { heart: 0, sparkles: 0, clap: 0, star: 0 },
          userReactions: data.userReactions || {},
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      set({ posts });
      console.log('Real-time posts updated:', posts.length);
    }, (error) => {
      console.error('Error in posts subscription:', error);
      set({ error: error.message });
    });

    return unsubscribe;
  },
}));
