'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import ConversationList from '@/components/messaging/ConversationList';
import ChatWindow from '@/components/messaging/ChatWindow';
import SimpleNewMessageModal from '@/components/messaging/SimpleNewMessageModal';
import { Conversation } from '@/types';

export default function MessagesPage() {
  const { user, appUser, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleNewMessage = () => {
    setShowNewMessage(true);
  };

  const handleCloseNewMessage = () => {
    setShowNewMessage(false);
  };

  const handleStartConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowNewMessage(false);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading messages...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user || !appUser) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please sign in to access your messages.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-screen flex bg-white">
        {/* Conversations Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <ConversationList
            onConversationSelect={handleConversationSelect}
            selectedConversationId={selectedConversation?.id}
            onNewMessage={handleNewMessage}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <ChatWindow 
              conversation={selectedConversation}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-600 mb-6">Choose from your existing conversations or start a new one</p>
                <button
                  onClick={handleNewMessage}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Start New Message
                </button>
              </div>
            </div>
          )}
        </div>

        {/* New Message Modal */}
        {showNewMessage && (
          <SimpleNewMessageModal
            isOpen={showNewMessage}
            onClose={handleCloseNewMessage}
            onStartConversation={handleStartConversation}
          />
        )}
      </div>
    </Layout>
  );
}
