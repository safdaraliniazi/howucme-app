'use client';

import { useEffect, useState } from 'react';
import { usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PostCard from './PostCard';
import { AppUser } from '@/types';

export default function Feed() {
  const { posts, loading, error, fetchPosts, subscribeToFeed } = usePostStore();
  const { appUser } = useAuthStore();
  const [userCache, setUserCache] = useState<Record<string, AppUser>>({});

  // Fetch user data for posts
  const { data: usersData } = useQuery({
    queryKey: ['feed-users', posts.map(p => p.fromUid)],
    queryFn: async () => {
      const uniqueUserIds = [...new Set(posts.map(p => p.fromUid))];
      const userPromises = uniqueUserIds.map(async (uid) => {
        if (userCache[uid]) return { uid, userData: userCache[uid] };
        
        try {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as AppUser;
            return { uid, userData };
          }
        } catch (error) {
          console.error('Error fetching user:', uid, error);
        }
        return { uid, userData: null };
      });

      const users = await Promise.all(userPromises);
      const newUserCache: Record<string, AppUser> = { ...userCache };
      
      users.forEach(({ uid, userData }) => {
        if (userData) {
          newUserCache[uid] = userData;
        }
      });

      setUserCache(newUserCache);
      return newUserCache;
    },
    enabled: posts.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!appUser) return;

    console.log('Setting up real-time feed subscription...');
    const unsubscribe = subscribeToFeed();
    
    return () => {
      console.log('Cleaning up feed subscription...');
      unsubscribe();
    };
  }, [appUser, subscribeToFeed]);

  // Initial fetch
  useEffect(() => {
    if (appUser && posts.length === 0) {
      fetchPosts();
    }
  }, [appUser, posts.length, fetchPosts]);

  if (!appUser) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center text-gray-500">
          Please sign in to view the feed.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Feed Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Recent Posts</h2>
        <p className="text-gray-600">Discover acts of kindness in your community</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-600 font-medium">Error loading feed</div>
          <div className="text-red-500 text-sm mt-1">{error}</div>
          <button
            onClick={() => fetchPosts()}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && posts.length === 0 && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Posts */}
      {posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              author={userCache[post.fromUid]}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💝</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No posts yet</h3>
          <p className="text-gray-600 mb-6">
            Be the first to share something kind with your community!
          </p>
          <div className="text-sm text-gray-500">
            Share moments of kindness, gratitude, or encouragement to brighten someone's day.
          </div>
        </div>
      )}

      {/* Feed Status */}
      {posts.length > 0 && (
        <div className="text-center mt-8 text-sm text-gray-500">
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <span>Loading more posts...</span>
            </div>
          ) : (
            <span>You're all caught up! ✨</span>
          )}
        </div>
      )}
    </div>
  );
}
