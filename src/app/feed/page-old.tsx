'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Feed from '@/components/feed/Feed';

export default function FeedPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-blue-600">Howucme</h1>
              <nav className="hidden md:flex space-x-6">
                <a href="/feed" className="text-blue-600 font-semibold">Feed</a>
                <a href="/relationships" className="text-gray-700 hover:text-blue-600 transition-colors">Relationships</a>
                <a href="/family" className="text-gray-700 hover:text-blue-600 transition-colors">Family</a>
                <a href="/profile" className="text-gray-700 hover:text-blue-600 transition-colors">Profile</a>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => useAuthStore.getState().signOut()}
                className="text-gray-600 hover:text-red-600 font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Feed />
      </main>
    </div>
  );
}
