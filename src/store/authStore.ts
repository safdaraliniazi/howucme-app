import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { AuthState, AppUser } from '@/types';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  appUser: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    try {
      console.log('Starting sign in process...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful:', userCredential.user.uid);
      // User data will be loaded by the auth state listener
    } catch (error: any) {
      console.error('Sign in error details:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle specific error types
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error: Please check your internet connection and disable any ad blockers for this site.');
      } else if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address.');
      }
      
      throw error;
    }
  },

  signInWithGoogle: async () => {
    try {
      console.log('Starting Google sign in process...');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log('Google sign in successful:', user.uid);

      // Check if user document exists, if not create it
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        console.log('Creating new user document for Google user...');
        const userData: AppUser = {
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          bio: '',
          profilePicUrl: user.photoURL || '',
          familyId: null,
          relationships: [],
          createdAt: new Date(),
        };

        await setDoc(doc(db, 'users', user.uid), userData);
        console.log('Google user document created successfully');
        set({ appUser: userData });
      }
      // User data will be loaded by the auth state listener
    } catch (error: any) {
      console.error('Google sign in error details:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign in was cancelled.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error: Please check your internet connection and disable any ad blockers for this site.');
      }
      
      throw error;
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    try {
      console.log('Starting sign up process...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User created successfully:', user.uid);

      // Create user document in Firestore
      const userData: AppUser = {
        uid: user.uid,
        name,
        email: user.email || '',
        bio: '',
        profilePicUrl: '',
        familyId: null,
        relationships: [],
        createdAt: new Date(),
      };

      console.log('Creating user document in Firestore...');
      await setDoc(doc(db, 'users', user.uid), userData);
      console.log('User document created successfully');
      set({ appUser: userData });
    } catch (error: any) {
      console.error('Sign up error details:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({ user: null, appUser: null });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  updateProfile: async (data: Partial<AppUser>) => {
    const { user, appUser } = get();
    if (!user || !appUser) throw new Error('No user logged in');

    try {
      const updatedData = { ...appUser, ...data };
      await updateDoc(doc(db, 'users', user.uid), data);
      set({ appUser: updatedData });
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },
}));

// Initialize auth state listener
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (user: User | null) => {
    console.log('Auth state changed:', user ? user.uid : 'null');
    
    if (user) {
      // Load user data from Firestore
      try {
        console.log('Loading user data from Firestore...');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const appUser = userDoc.data() as AppUser;
          console.log('User data loaded successfully');
          useAuthStore.setState({ user, appUser, loading: false });
          
          // Initialize achievements after user data is loaded
          try {
            const { useAchievementStore } = await import('./achievementStore');
            const achievementStore = useAchievementStore.getState();
            await achievementStore.fetchAchievements();
            await achievementStore.fetchUserAchievements();
            await achievementStore.checkAndUnlockAchievements();
            console.log('Achievements initialized successfully');
          } catch (achievementError) {
            console.error('Error initializing achievements:', achievementError);
            // Don't throw here - user should still be able to use the app
          }
        } else {
          console.warn('User exists in Auth but not in Firestore');
          useAuthStore.setState({ user, appUser: null, loading: false });
        }
      } catch (error: any) {
        console.error('Error loading user data:', error);
        
        if (error.code === 'unavailable' || error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
          console.error('Firebase connection blocked. Please disable ad blockers and try again.');
        }
        
        useAuthStore.setState({ user, appUser: null, loading: false });
      }
    } else {
      console.log('User signed out');
      useAuthStore.setState({ user: null, appUser: null, loading: false });
    }
  });
}
