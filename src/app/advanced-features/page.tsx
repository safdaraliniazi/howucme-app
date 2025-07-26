'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import CommunityCalendar from '@/components/community/CommunityCalendar';
import EventCreationWizardSimple from '@/components/community/EventCreationWizardSimple';
import ConversationList from '@/components/community/ConversationList';
import ChatWindow from '@/components/community/ChatWindow';
import ModerationDashboard from '@/components/community/ModerationDashboard';
import NotificationCenter from '@/components/community/NotificationCenter';
import CommunityPolls from '@/components/community/CommunityPolls';
import AchievementSystem from '@/components/community/AchievementSystem';
import { EnhancedCommunityEvent, Conversation } from '@/types';

export default function AdvancedCommunityFeatures() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'calendar' | 'messaging' | 'moderation' | 'notifications' | 'polls' | 'achievements'>('calendar');
  const [showEventWizard, setShowEventWizard] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EnhancedCommunityEvent | null>(null);

  // Mock community ID for demo
  const mockCommunityId = 'demo-community-123';

  const handleEventCreated = (event: EnhancedCommunityEvent) => {
    console.log('Event created:', event);
    setSelectedEvent(event);
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const TabButton = ({ 
    id, 
    label, 
    icon, 
    isActive, 
    onClick 
  }: { 
    id: string; 
    label: string; 
    icon: string; 
    isActive: boolean; 
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to access advanced community features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Advanced Community Features</h1>
              <p className="text-sm text-gray-600">Week 9 & 10 - Enhanced Events & Real-time Messaging</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.displayName || user.email}</span>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {(user.displayName || user.email)?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 py-4">
            <TabButton
              id="calendar"
              label="Community Calendar"
              icon="📅"
              isActive={activeTab === 'calendar'}
              onClick={() => setActiveTab('calendar')}
            />
            <TabButton
              id="messaging"
              label="Real-time Messaging"
              icon="💬"
              isActive={activeTab === 'messaging'}
              onClick={() => setActiveTab('messaging')}
            />
            <TabButton
              id="moderation"
              label="Moderation Dashboard"
              icon="🛡️"
              isActive={activeTab === 'moderation'}
              onClick={() => setActiveTab('moderation')}
            />
            <TabButton
              id="notifications"
              label="Notification Center"
              icon="🔔"
              isActive={activeTab === 'notifications'}
              onClick={() => setActiveTab('notifications')}
            />
            <TabButton
              id="polls"
              label="Community Polls"
              icon="📊"
              isActive={activeTab === 'polls'}
              onClick={() => setActiveTab('polls')}
            />
            <TabButton
              id="achievements"
              label="Achievements"
              icon="🏆"
              isActive={activeTab === 'achievements'}
              onClick={() => setActiveTab('achievements')}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Community Calendar</h2>
                <p className="text-gray-600">Enhanced events with RSVP, waitlists, and calendar views</p>
              </div>
              <button
                onClick={() => setShowEventWizard(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Event</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow">
              <CommunityCalendar
                communityId={mockCommunityId}
                onEventSelect={setSelectedEvent}
                onDateSelect={(date) => console.log('Date selected:', date)}
              />
            </div>

            {/* Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-semibold text-gray-900 mb-2">RSVP Management</h3>
                <p className="text-gray-600 text-sm">Track attendance with RSVP status, check-in functionality, and waitlist management for capacity-limited events.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold text-gray-900 mb-2">Multiple Calendar Views</h3>
                <p className="text-gray-600 text-sm">Switch between month, week, and day views with real-time event updates and interactive date selection.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl mb-2">🔄</div>
                <h3 className="font-semibold text-gray-900 mb-2">Recurring Events</h3>
                <p className="text-gray-600 text-sm">Create recurring events with customizable frequencies and automatic series management.</p>
              </div>
            </div>
          </div>
        )}

        {/* Messaging Tab */}
        {activeTab === 'messaging' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Real-time Messaging</h2>
              <p className="text-gray-600">Direct messages, group chats, and real-time communication</p>
            </div>

            <div className="bg-white rounded-lg shadow h-96 flex">
              <div className="w-1/3 border-r border-gray-200">
                <ConversationList
                  communityId={mockCommunityId}
                  onConversationSelect={handleConversationSelect}
                  selectedConversationId={selectedConversation?.id}
                />
              </div>
              <div className="flex-1 flex">
                {selectedConversation ? (
                  <ChatWindow 
                    conversation={selectedConversation}
                    onClose={() => setSelectedConversation(null)}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <div className="text-4xl mb-2">💬</div>
                      <h3 className="font-medium text-gray-900">Select a Conversation</h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Choose a conversation from the list to start messaging
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Messaging Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="font-semibold text-gray-900 mb-2">Real-time Updates</h3>
                <p className="text-gray-600 text-sm">Instant message delivery, typing indicators, and read receipts with Firebase real-time listeners.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl mb-2">😊</div>
                <h3 className="font-semibold text-gray-900 mb-2">Message Reactions</h3>
                <p className="text-gray-600 text-sm">React to messages with emojis, edit messages, and reply to specific messages in conversations.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl mb-2">👥</div>
                <h3 className="font-semibold text-gray-900 mb-2">Group Chat Support</h3>
                <p className="text-gray-600 text-sm">Create group conversations, manage participants, and organize community discussions.</p>
              </div>
            </div>
          </div>
        )}

        {/* Moderation Tab */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Moderation Dashboard</h2>
              <p className="text-gray-600">Content moderation and community management tools</p>
            </div>

            <ModerationDashboard communityId={mockCommunityId} />
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Notification Center</h2>
              <p className="text-gray-600">Multi-channel notification management and preferences</p>
            </div>

            <NotificationCenter communityId={mockCommunityId} />
          </div>
        )}

        {/* Polls Tab */}
        {activeTab === 'polls' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Community Polls</h2>
              <p className="text-gray-600">Create and participate in community polls and voting</p>
            </div>

            <CommunityPolls communityId={mockCommunityId} />
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Achievement System</h2>
              <p className="text-gray-600">Track community participation and earn rewards</p>
            </div>

            <AchievementSystem communityId={mockCommunityId} />
          </div>
        )}
      </div>

      {/* Event Creation Wizard */}
      <EventCreationWizardSimple
        communityId={mockCommunityId}
        isOpen={showEventWizard}
        onClose={() => setShowEventWizard(false)}
        onEventCreated={handleEventCreated}
      />

      {/* Progress Indicator */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
        <div className="text-sm font-medium text-gray-900 mb-2">Week 9 & 10 Progress</div>
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <span className="text-green-600 mr-2">✅</span>
            <span className="text-gray-700">Enhanced Event System</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-green-600 mr-2">✅</span>
            <span className="text-gray-700">Real-time Messaging</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-green-600 mr-2">✅</span>
            <span className="text-gray-700">Moderation Tools</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-green-600 mr-2">✅</span>
            <span className="text-gray-700">Notification System</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-green-600 mr-2">✅</span>
            <span className="text-gray-700">Community Polls</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-green-600 mr-2">✅</span>
            <span className="text-gray-700">Achievement System</span>
          </div>
        </div>
      </div>
    </div>
  );
}
