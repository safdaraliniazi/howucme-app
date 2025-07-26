'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCommunityStore } from '@/store/communityStore';
import { useMessagingStore } from '@/store/messagingStore';
import { Conversation } from '@/types';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartConversation: (conversation: Conversation) => void;
}

export default function NewMessageModal({ isOpen, onClose, onStartConversation }: NewMessageModalProps) {
  const { appUser } = useAuthStore();
  const { communities } = useCommunityStore();
  const { createConversation } = useMessagingStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock users for demonstration - in real app, this would come from a user search API
  const mockUsers = [
    {
      id: 'user1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      avatar: null,
      lastSeen: 'Online',
      isOnline: true
    },
    {
      id: 'user2', 
      name: 'Mike Chen',
      email: 'mike@example.com',
      avatar: null,
      lastSeen: '2 hours ago',
      isOnline: false
    },
    {
      id: 'user3',
      name: 'Emma Wilson',
      email: 'emma@example.com', 
      avatar: null,
      lastSeen: 'Online',
      isOnline: true
    },
    {
      id: 'user4',
      name: 'Alex Rodriguez',
      email: 'alex@example.com',
      avatar: null,
      lastSeen: '1 day ago',
      isOnline: false
    },
    {
      id: 'user5',
      name: 'Lisa Park',
      email: 'lisa@example.com',
      avatar: null,
      lastSeen: 'Online',
      isOnline: true
    }
  ];

  useEffect(() => {
    if (isOpen) {
      // Filter users based on search term
      const filtered = mockUsers.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setAvailableUsers(filtered);
    }
  }, [searchTerm, isOpen]);

  const handleUserSelect = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedUsers(prev => [...prev, userId]);
    }
  };

  const handleStartConversation = async () => {
    if (selectedUsers.length === 0 || !appUser) return;

    setLoading(true);
    try {
      // Get selected user details
      const selectedUserDetails = availableUsers.filter(user => selectedUsers.includes(user.id));
      
      // Create conversation participants
      const participants = [appUser.uid, ...selectedUsers];
      const participantNames = [
        appUser.name,
        ...selectedUserDetails.map(user => user.name)
      ];
      const participantAvatars = [
        appUser.profilePicUrl || '',
        ...selectedUserDetails.map(user => user.avatar || '')
      ];

      // Determine conversation type and name
      const isGroup = selectedUsers.length > 1;
      const conversationName = isGroup 
        ? `Group with ${selectedUserDetails.map(u => u.name).join(', ')}`
        : selectedUserDetails[0]?.name || 'Direct Message';

      // Create new conversation
      const newConversation: Conversation = {
        id: `conv_${Date.now()}`,
        participants,
        participantNames,
        participantAvatars,
        lastMessage: {
          content: 'Conversation started',
          fromUserId: appUser.uid,
          fromUserName: appUser.name,
          timestamp: new Date(),
          type: 'system'
        },
        updatedAt: new Date(),
        isGroupChat: isGroup,
        groupName: isGroup ? conversationName : undefined,
        groupAvatar: undefined,
        createdAt: new Date(),
        createdBy: appUser.uid
      };

      // Use messaging store to create conversation
      await createConversation(participants);
      
      // Start the conversation
      onStartConversation(newConversation);
      
      // Reset state
      setSelectedUsers([]);
      setSearchTerm('');
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedUserNames = () => {
    const selectedUserDetails = availableUsers.filter(user => selectedUsers.includes(user.id));
    return selectedUserDetails.map(user => user.name).join(', ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">New Message</h2>
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
              placeholder="Search people..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="p-4 bg-blue-50 border-b border-gray-200">
            <div className="text-sm text-blue-800 mb-2">
              To: {getSelectedUserNames()}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(userId => {
                const user = availableUsers.find(u => u.id === userId);
                return user ? (
                  <span
                    key={userId}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {user.name}
                    <button
                      onClick={() => handleUserSelect(userId)}
                      className="ml-1 hover:text-blue-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* User List */}
        <div className="max-h-96 overflow-y-auto">
          {availableUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p>No users found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="py-2">
              {availableUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selectedUsers.includes(user.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
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
                      {user.isOnline ? 'Online' : user.lastSeen}
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {selectedUsers.includes(user.id) && (
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStartConversation}
            disabled={selectedUsers.length === 0 || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Starting...' : `Start Chat${selectedUsers.length > 1 ? ' Group' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
