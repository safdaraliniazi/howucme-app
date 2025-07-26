'use client';

import { useState, useEffect, useRef } from 'react';
import { useMessagingStore } from '@/store/messagingStore';
import { useAuthStore } from '@/store/authStore';
import { Conversation, Message } from '@/types';

interface ChatWindowProps {
  conversation: Conversation;
}

export default function ChatWindow({ conversation }: ChatWindowProps) {
  const { user, appUser } = useAuthStore();
  const {
    messages,
    sendMessage,
    subscribeToConversation,
    markAsRead,
    setTyping
  } = useMessagingStore();

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const conversationMessages = messages[conversation.id] || [];

  useEffect(() => {
    if (conversation.id) {
      const unsubscribe = subscribeToConversation(conversation.id);
      markAsRead(conversation.id);
      return unsubscribe;
    }
  }, [conversation.id, subscribeToConversation, markAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await sendMessage(conversation.id, messageContent);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    setTyping(conversation.id, isTyping);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    
    return currentDate !== previousDate;
  };

  const otherParticipants = conversation.participantNames.filter(name => name !== appUser?.name);
  const displayName = conversation.isGroupChat 
    ? conversation.groupName 
    : otherParticipants[0] || 'Unknown User';

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {conversation.isGroupChat ? (
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {displayName?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>

          {/* Name and info */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
            {conversation.isGroupChat && (
              <p className="text-sm text-gray-500">
                {conversation.participants.length} members
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {conversationMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.001 8.001 0 01-7.003-4.165c-.35-.566-.535-1.216-.535-1.835 0-1.657 1.343-3 3-3h.28a1 1 0 01.95.694l.007.022a1 1 0 00.95.694H10a3 3 0 003-3V7a8 8 0 018 5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-500">Start the conversation by sending a message!</p>
            </div>
          </div>
        ) : (
          <>
            {conversationMessages.map((message, index) => {
              const previousMessage = index > 0 ? conversationMessages[index - 1] : undefined;
              const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
                  const isOwnMessage = message.fromUserId === appUser?.uid;              return (
                <div key={message.id}>
                  {/* Date separator */}
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4">
                      <div className="px-3 py-1 bg-gray-100 rounded-full">
                        <span className="text-xs text-gray-600 font-medium">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwnMessage 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {/* Sender name for group chats */}
                      {conversation.isGroupChat && !isOwnMessage && (
                        <p className="text-xs text-gray-500 mb-1 font-medium">
                          {message.fromUserName}
                        </p>
                      )}
                      
                      {/* Message content */}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      
                      {/* Time */}
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.createdAt)}
                        {message.editedAt && ' (edited)'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping(e.target.value.length > 0);
              }}
              onBlur={() => handleTyping(false)}
              placeholder={`Message ${displayName}...`}
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
