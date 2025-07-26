'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';

export default function RelationshipsPage() {
  const { user, appUser, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user || !appUser) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Relationship Tagging System</h1>
            <p className="text-gray-600 mb-8">Coming soon in Week 3 - Define your unique connections</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-l-4 border-purple-500 bg-purple-50 p-6 rounded-r-lg">
                <h3 className="font-semibold text-purple-900 mb-3">🏷️ Relationship Types</h3>
                <ul className="text-purple-800 space-y-2">
                  <li>• Partner</li>
                  <li>• Close Friend</li>
                  <li>• Mentor</li>
                  <li>• Family Member</li>
                  <li>• Custom Tags</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-blue-500 bg-blue-50 p-6 rounded-r-lg">
                <h3 className="font-semibold text-blue-900 mb-3">✨ Features</h3>
                <ul className="text-blue-800 space-y-2">
                  <li>• Define relationship depth</li>
                  <li>• Set interaction preferences</li>
                  <li>• Track relationship growth</li>
                  <li>• Privacy controls</li>
                  <li>• Relationship insights</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">💝 How It Works</h3>
              <p className="text-gray-700">
                The Relationship Tagging System allows you to define and categorize your connections 
                in meaningful ways. Whether it's a romantic partner, chosen family member, or mentor, 
                you'll be able to customize how you interact and share within each relationship.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
