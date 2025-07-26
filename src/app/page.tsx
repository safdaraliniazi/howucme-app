'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';

export default function Home() {
  const { user, appUser, loading, signOut } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect authenticated users to feed
        router.push('/feed');
      } else {
        // Redirect unauthenticated users to auth
        router.push('/auth');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Layout showHeader={false} showFooter={false}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <div className="text-center p-8">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Howucme</h2>
            <p className="text-gray-700 text-lg">Loading your experience...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user || !appUser) {
    return null; // Will redirect to auth
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to your Kindness Community
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Start sharing kindness, building relationships, and creating your chosen family.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/feed')}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Go to Feed
                </button>
                <button
                  onClick={() => router.push('/family')}
                  className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Explore Family
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Share Kindness</h3>
              <p className="text-gray-600 mb-4">Post moments of kindness and appreciation for your community.</p>
              <button
                onClick={() => router.push('/feed')}
                className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
              >
                Start Sharing →
              </button>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Build Relationships</h3>
              <p className="text-gray-600 mb-4">Connect with others and define your unique relationships.</p>
              <button
                onClick={() => router.push('/relationships')}
                className="text-purple-600 font-medium hover:text-purple-700 transition-colors"
              >
                Explore Connections →
              </button>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">👨‍👩‍👧‍👦</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Create Family</h3>
              <p className="text-gray-600 mb-4">Form chosen families with custom roles and rituals.</p>
              <button
                onClick={() => router.push('/family')}
                className="text-green-600 font-medium hover:text-green-700 transition-colors"
              >
                Build Family →
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-4">Your Howucme Journey</h3>
              <p className="text-gray-300 text-lg">See how you're building your community</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-400 mb-2">12</div>
                <div className="text-gray-300">Kindness Posts</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-400 mb-2">8</div>
                <div className="text-gray-300">Relationships</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-400 mb-2">3</div>
                <div className="text-gray-300">Family Members</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-yellow-400 mb-2">24</div>
                <div className="text-gray-300">Memories Shared</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
