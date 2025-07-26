'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRelationshipStore } from '@/store/relationshipStore';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import UserCard from '@/components/profile/UserCard';
import { AppUser, Relationship } from '@/types';

export default function UsersPage() {
  const { user, appUser, loading: authLoading } = useAuthStore();
  const { 
    users, 
    relationships,
    loading,
    searchUsers,
    subscribeToRelationships
  } = useRelationshipStore();
  
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'connected'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
      return;
    }

    if (appUser) {
      // Subscribe to real-time relationship updates
      const unsubscribe = subscribeToRelationships();
      
      // Initial search to load users
      searchUsers('');
      
      return () => unsubscribe();
    }
  }, [appUser, authLoading, user, router, searchUsers, subscribeToRelationships]);

  useEffect(() => {
    if (appUser && searchTerm !== undefined) {
      const debounceTimer = setTimeout(() => {
        searchUsers(searchTerm);
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, appUser, searchUsers]);

  const getUserRelationship = (userId: string): Relationship | undefined => {
    return relationships.find(r => 
      (r.from === userId && r.to === appUser?.uid) ||
      (r.from === appUser?.uid && r.to === userId)
    );
  };

  const filteredUsers = users.filter((user: AppUser) => {
    if (!appUser) return false;
    
    // Don't show current user
    if (user.uid === appUser.uid) return false;
    
    const relationship = getUserRelationship(user.uid);
    
    switch (activeFilter) {
      case 'connected':
        return relationship && relationship.status === 'accepted';
      case 'available':
        return !relationship || relationship.status !== 'accepted';
      case 'all':
      default:
        return true;
    }
  });

  if (authLoading) {
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Discover People</h1>
            <p className="text-gray-600">Connect with others, view profiles, and start conversations</p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search people by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Users
                </button>
                <button
                  onClick={() => setActiveFilter('connected')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === 'connected'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Connected
                </button>
                <button
                  onClick={() => setActiveFilter('available')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === 'available'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Available
                </button>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mt-4 text-sm text-gray-600">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </div>
              ) : (
                <span>
                  Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                  {searchTerm && ` matching "${searchTerm}"`}
                </span>
              )}
            </div>
          </div>

          {/* User Grid */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search terms or filters'
                  : 'No users match your current filter selection'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user: AppUser) => (
                <UserCard
                  key={user.uid}
                  user={user}
                  relationship={getUserRelationship(user.uid)}
                  showMessageButton={true}
                  showConnectButton={true}
                  compact={false}
                />
              ))}
            </div>
          )}

          {/* Instagram/Facebook-style tips */}
          <div className="mt-12 bg-blue-50 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Privacy & Connections</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Click on profiles to view what's publicly available</li>
                  <li>• Connect with people to see more of their content</li>
                  <li>• Some profiles may be private and require connection</li>
                  <li>• Use the message button to start conversations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
