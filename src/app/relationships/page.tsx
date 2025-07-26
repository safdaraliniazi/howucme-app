'use client';

import { useAuthStore } from '@/store/authStore';
import { useRelationshipStore } from '@/store/relationshipStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import RelationshipInfo from '@/components/relationships/RelationshipInfo';

export default function RelationshipsPage() {
  const { user, appUser, loading: authLoading } = useAuthStore();
  const { 
    relationships, 
    pendingRequests, 
    users, 
    loading,
    fetchRelationships,
    fetchPendingRequests,
    searchUsers,
    sendRelationshipRequest,
    acceptRequest,
    rejectRequest,
    subscribeToRelationships
  } = useRelationshipStore();
  
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'relationships' | 'requests' | 'search'>('relationships');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const relationshipLabels = [
    'Brother', 'Sister', 'Best Friend', 'Close Friend', 'Mentor', 'Student', 
    'Cousin', 'Uncle', 'Aunt', 'Grandparent', 'Partner', 'Colleague'
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (appUser) {
      fetchRelationships();
      fetchPendingRequests();
      
      // Subscribe to real-time updates
      const unsubscribe = subscribeToRelationships();
      return () => unsubscribe();
    }
  }, [appUser]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim().length > 2) {
      await searchUsers(term);
    }
  };

  const handleSendRequest = async () => {
    if (selectedUserId && selectedLabel) {
      try {
        await sendRelationshipRequest(selectedUserId, selectedLabel);
        setSelectedUserId(null);
        setSelectedLabel('');
        setActiveTab('requests'); // Switch to requests tab to see sent request
      } catch (error) {
        console.error('Error sending request:', error);
      }
    }
  };

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
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Relationships</h1>
          <p className="text-gray-600">Manage your connections and build your chosen family</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('relationships')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'relationships'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Relationships ({relationships.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Requests ({pendingRequests.length})
              {pendingRequests.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Find People
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'relationships' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Relationships</h2>
            {relationships.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No relationships yet</h3>
                <p className="text-gray-500 mb-4">Start building your chosen family by connecting with others</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Find People
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {relationships.map((relationship) => {
                  const isFromCurrentUser = relationship.from === appUser.uid;
                  const otherUserName = isFromCurrentUser ? relationship.toUserName : relationship.fromUserName;
                  const otherUserId = isFromCurrentUser ? relationship.to : relationship.from;
                  
                  return (
                    <div key={relationship.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg font-medium">
                              {otherUserName?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{otherUserName || 'Unknown User'}</h3>
                            <p className="text-blue-600 font-medium">{relationship.label}</p>
                            <p className="text-sm text-gray-500">
                              Connected {relationship.acceptedAt?.toLocaleDateString() || 'recently'}
                            </p>
                          </div>
                        </div>
                        <div className="text-2xl">💝</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📬</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                <p className="text-gray-500">When someone sends you a relationship request, it will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg font-medium">
                            {request.fromUserName?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{request.fromUserName || 'Unknown User'}</h3>
                          <p className="text-green-600 font-medium">wants to be your {request.label}</p>
                          <p className="text-sm text-gray-500">
                            Sent {request.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => acceptRequest(request.id)}
                          disabled={loading}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                        >
                          {loading ? 'Accepting...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => rejectRequest(request.id)}
                          disabled={loading}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                        >
                          {loading ? 'Declining...' : 'Decline'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Find People</h2>
            
            {/* Search Input */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Search Results */}
            {users.length === 0 && searchTerm.length > 2 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No users found matching "{searchTerm}"</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {users.map((user) => {
                  const hasRelationship = user.relationshipStatus;
                  const isConnected = user.relationshipStatus === 'accepted';
                  const isPending = user.relationshipStatus === 'pending';
                  const isBlocked = user.relationshipStatus === 'blocked';
                  
                  return (
                    <div key={user.uid} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{user.name}</h3>
                            <p className="text-gray-600">{user.email}</p>
                            {user.bio && <p className="text-sm text-gray-500 mt-1">{user.bio}</p>}
                          </div>
                        </div>
                        
                        {/* Relationship Status Display */}
                        <div className="flex items-center space-x-2">
                          {isConnected && (
                            <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg">
                              <span className="text-sm">💝</span>
                              <span className="font-medium text-sm">{user.relationshipLabel}</span>
                            </div>
                          )}
                          
                          {isPending && (
                            <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg">
                              <span className="text-sm">⏳</span>
                              <span className="font-medium text-sm">Request Pending</span>
                            </div>
                          )}
                          
                          {isBlocked && (
                            <div className="flex items-center space-x-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg">
                              <span className="text-sm">🚫</span>
                              <span className="font-medium text-sm">Blocked</span>
                            </div>
                          )}
                          
                          {!hasRelationship && (
                            <button
                              onClick={() => setSelectedUserId(user.uid)}
                              disabled={loading}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                            >
                              Connect
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Relationship Label Modal */}
        {selectedUserId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Relationship Type</h3>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {relationshipLabels.map((label) => (
                  <button
                    key={label}
                    onClick={() => setSelectedLabel(label)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      selectedLabel === label
                        ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-sm'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSendRequest}
                  disabled={!selectedLabel || loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {loading ? 'Sending...' : 'Send Request'}
                </button>
                <button
                  onClick={() => {
                    setSelectedUserId(null);
                    setSelectedLabel('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Floating Info Button */}
      <RelationshipInfo />
    </Layout>
  );
}
