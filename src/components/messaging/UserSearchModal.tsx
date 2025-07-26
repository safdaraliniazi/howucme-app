'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCommunityStore } from '@/store/communityStore';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: any) => void;
}

export default function UserSearchModal({ isOpen, onClose, onSelectUser }: UserSearchModalProps) {
  const { appUser } = useAuthStore();
  const { communities } = useCommunityStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'recent' | 'suggested'>('recent');

  // Mock data for demonstration
  const mockRecentUsers = [
    {
      id: 'user1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      avatar: null,
      lastSeen: 'Online',
      isOnline: true,
      mutualConnections: 3
    },
    {
      id: 'user2',
      name: 'Mike Chen',
      email: 'mike@example.com',
      avatar: null,
      lastSeen: '2 hours ago',
      isOnline: false,
      mutualConnections: 1
    }
  ];

  const mockSuggestedUsers = [
    {
      id: 'user3',
      name: 'Emma Wilson',
      email: 'emma@example.com',
      avatar: null,
      lastSeen: 'Online',
      isOnline: true,
      mutualConnections: 5,
      reason: 'From Tech Community'
    },
    {
      id: 'user4',
      name: 'Alex Rodriguez',
      email: 'alex@example.com',
      avatar: null,
      lastSeen: '1 day ago',
      isOnline: false,
      mutualConnections: 2,
      reason: 'Friend suggestion'
    }
  ];

  useEffect(() => {
    if (searchTerm.length > 0) {
      setLoading(true);
      // Simulate API search
      setTimeout(() => {
        const allUsers = [...mockRecentUsers, ...mockSuggestedUsers];
        const filtered = allUsers.filter(user =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(filtered);
        setLoading(false);
      }, 300);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const handleUserSelect = (user: any) => {
    onSelectUser(user);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Start a conversation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for people..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'recent', label: 'Recent', icon: '🕐' },
            { id: 'suggested', label: 'Suggested', icon: '✨' },
            { id: 'search', label: 'Search', icon: '🔍' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Search Results */}
          {activeTab === 'search' && (
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600">Searching...</span>
                </div>
              ) : searchTerm.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p>Type to search for people</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p>No users found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <UserCard key={user.id} user={user} onSelect={handleUserSelect} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Conversations */}
          {activeTab === 'recent' && (
            <div className="p-4">
              <div className="space-y-2">
                {mockRecentUsers.map((user) => (
                  <UserCard key={user.id} user={user} onSelect={handleUserSelect} />
                ))}
              </div>
            </div>
          )}

          {/* Suggested Users */}
          {activeTab === 'suggested' && (
            <div className="p-4">
              <div className="space-y-2">
                {mockSuggestedUsers.map((user) => (
                  <UserCard key={user.id} user={user} onSelect={handleUserSelect} showReason />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface UserCardProps {
  user: any;
  onSelect: (user: any) => void;
  showReason?: boolean;
}

function UserCard({ user, onSelect, showReason = false }: UserCardProps) {
  return (
    <button
      onClick={() => onSelect(user)}
      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
    >
      {/* Avatar */}
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white font-medium">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        {user.isOnline && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 text-left">
        <div className="font-medium text-gray-900">{user.name}</div>
        <div className="text-sm text-gray-500">
          {showReason && user.reason ? user.reason : user.isOnline ? 'Online' : user.lastSeen}
        </div>
        {user.mutualConnections > 0 && (
          <div className="text-xs text-blue-600">
            {user.mutualConnections} mutual connection{user.mutualConnections > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Message Icon */}
      <div className="text-gray-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
    </button>
  );
}
