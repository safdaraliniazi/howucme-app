'use client';

import { useState, useEffect } from 'react';
import { useMessagingStore } from '@/store/messagingStore';
import { useAuthStore } from '@/store/authStore';
import { Conversation } from '@/types';

interface ConversationListProps {
  communityId: string;
  onConversationSelect: (conversation: Conversation) => void;
  selectedConversationId?: string;
}

export default function ConversationList({ 
  communityId, 
  onConversationSelect, 
  selectedConversationId 
}: ConversationListProps) {
  const { user } = useAuthStore();
  const {
    conversations,
    loading,
    error,
    fetchConversations,
    subscribeToConversations
  } = useMessagingStore();

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchConversations();
      
      // Subscribe to real-time updates
      const unsubscribe = subscribeToConversations();
      return () => unsubscribe();
    }
  }, [user]);

  const filteredConversations = conversations.filter(conversation =>
    conversation.groupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.participantNames.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getUnreadCount = (conversation: Conversation) => {
    if (!user) return 0;
    
    // For now, we'll implement a simple unread indicator
    // This would need to be expanded with proper read receipt tracking
    return conversation.lastMessage ? 0 : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading conversations: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Messages</h2>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-gray-500">
              {searchTerm ? 'No conversations found' : 'No messages yet'}
            </p>
            {!searchTerm && (
              <p className="text-gray-400 text-sm mt-1">
                Start a conversation with community members
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => {
              const unreadCount = getUnreadCount(conversation);
              const isSelected = conversation.id === selectedConversationId;
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {!conversation.isGroupChat ? (
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {conversation.participantNames[0]?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium truncate ${
                          unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {conversation.groupName || 
                           (!conversation.isGroupChat 
                             ? conversation.participantNames.find(p => p !== user?.displayName) || 'Unknown User'
                             : `Group Chat (${conversation.participantNames.length})`)}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-500">
                              {formatLastMessageTime(conversation.lastMessage.timestamp)}
                            </span>
                          )}
                          {unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {conversation.lastMessage && (
                        <p className={`text-sm truncate mt-1 ${
                          unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                        }`}>
                          {conversation.lastMessage.type === 'text' 
                            ? conversation.lastMessage.content
                            : conversation.lastMessage.type === 'image'
                            ? '📷 Image'
                            : conversation.lastMessage.type === 'file'
                            ? '📎 File'
                            : 'Message'}
                        </p>
                      )}

                      {/* Removed typing indicator for now */}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Message Button */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
          <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Message
        </button>
      </div>
    </div>
  );
}
