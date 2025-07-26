'use client';

import { useState, useEffect } from 'react';
import { useMessagingStore } from '@/store/messagingStore';
import { useAuthStore } from '@/store/authStore';
import { Conversation } from '@/types';

interface ConversationListProps {
  onConversationSelect: (conversation: Conversation) => void;
  selectedConversationId?: string;
  onNewMessage: () => void;
}

export default function ConversationList({ 
  onConversationSelect, 
  selectedConversationId,
  onNewMessage 
}: ConversationListProps) {
  const { user, appUser } = useAuthStore();
  const {
    conversations,
    loading,
    error,
    fetchConversations,
    subscribeToConversations
  } = useMessagingStore();

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (appUser) {
      console.log('ConversationList: AppUser detected, fetching conversations for:', appUser.uid);
      fetchConversations();
      const unsubscribe = subscribeToConversations();
      return unsubscribe;
    } else {
      console.log('ConversationList: No appUser detected, user:', user?.uid);
    }
  }, [appUser, fetchConversations, subscribeToConversations]);

  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm) return true;
    
    // Filter by participant names or group name
    const searchLower = searchTerm.toLowerCase();
    return (
      conversation.participantNames.some(name => 
        name.toLowerCase().includes(searchLower)
      ) ||
      (conversation.groupName && conversation.groupName.toLowerCase().includes(searchLower)) ||
      conversation.lastMessage.content.toLowerCase().includes(searchLower)
    );
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading conversations...</p>
          <p className="text-xs text-gray-400 mt-1">User: {appUser?.uid || user?.uid || 'No user'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading conversations</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button 
            onClick={fetchConversations}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
          <button
            onClick={onNewMessage}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="New Message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        
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
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.001 8.001 0 01-7.003-4.165c-.35-.566-.535-1.216-.535-1.835 0-1.657 1.343-3 3-3h.28a1 1 0 01.95.694l.007.022a1 1 0 00.95.694H10a3 3 0 003-3V7a8 8 0 018 5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-500 mb-2">Start a conversation with someone from your communities</p>
            <p className="text-xs text-gray-400 mb-4">
              Total conversations: {conversations.length} | 
              Filtered: {filteredConversations.length} | 
              Search: "{searchTerm}"
            </p>
            <button
              onClick={onNewMessage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start a conversation
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation.id;
              const otherParticipants = conversation.participantNames.filter(name => name !== appUser?.name);
              const displayName = conversation.isGroupChat 
                ? conversation.groupName 
                : otherParticipants[0] || 'Unknown User';
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {conversation.isGroupChat ? (
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {displayName?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {displayName}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.lastMessage.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conversation.lastMessage.fromUserName !== appUser?.name && 
                         conversation.lastMessage.fromUserName && 
                         `${conversation.lastMessage.fromUserName}: `}
                        {conversation.lastMessage.content || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
