'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

interface NotificationCenterProps {
  communityId: string;
}

export default function NotificationCenter({ communityId }: NotificationCenterProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'mentions' | 'settings'>('all');
  const [notifications, setNotifications] = useState<any[]>([]);

  // Mock notifications for demonstration
  const mockNotifications = [
    {
      id: '1',
      type: 'event_reminder',
      title: 'Event Reminder: Weekly Meetup',
      message: 'Your event "Weekly Meetup" starts in 1 hour',
      timestamp: new Date(Date.now() - 3600000),
      read: false,
      actionUrl: '/events/weekly-meetup',
      icon: '📅',
      priority: 'high'
    },
    {
      id: '2',
      type: 'new_message',
      title: 'New Message from Sarah',
      message: 'Hey! Just wanted to follow up on our discussion...',
      timestamp: new Date(Date.now() - 7200000),
      read: false,
      actionUrl: '/messages/sarah',
      icon: '💬',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'mention',
      title: 'You were mentioned in a post',
      message: '@john mentioned you in "Community Guidelines Discussion"',
      timestamp: new Date(Date.now() - 14400000),
      read: true,
      actionUrl: '/posts/guidelines-discussion',
      icon: '🏷️',
      priority: 'medium'
    },
    {
      id: '4',
      type: 'event_update',
      title: 'Event Updated: Tech Talk',
      message: 'The location for "Tech Talk" has been changed',
      timestamp: new Date(Date.now() - 86400000),
      read: true,
      actionUrl: '/events/tech-talk',
      icon: '📍',
      priority: 'low'
    },
    {
      id: '5',
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: 'You\'ve earned the "Community Helper" badge',
      timestamp: new Date(Date.now() - 172800000),
      read: false,
      actionUrl: '/achievements',
      icon: '🏆',
      priority: 'low'
    },
    {
      id: '6',
      type: 'community_update',
      title: 'Community Guidelines Updated',
      message: 'Please review the updated community guidelines',
      timestamp: new Date(Date.now() - 259200000),
      read: true,
      actionUrl: '/guidelines',
      icon: '📋',
      priority: 'medium'
    }
  ];

  useEffect(() => {
    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const mentionCount = notifications.filter(n => n.type === 'mention' && !n.read).length;

  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread':
        return !notification.read;
      case 'mentions':
        return notification.type === 'mention';
      case 'all':
      default:
        return true;
    }
  });

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-300';
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const TabButton = ({ 
    id, 
    label, 
    count,
    isActive, 
    onClick 
  }: { 
    id: string; 
    label: string; 
    count?: number;
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
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`px-2 py-1 text-xs rounded-full ${
          isActive ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={markAllAsRead}
              className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800"
              disabled={unreadCount === 0}
            >
              Mark all read
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mt-6">
          <TabButton
            id="all"
            label="All"
            count={notifications.length}
            isActive={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          />
          <TabButton
            id="unread"
            label="Unread"
            count={unreadCount}
            isActive={activeTab === 'unread'}
            onClick={() => setActiveTab('unread')}
          />
          <TabButton
            id="mentions"
            label="Mentions"
            count={mentionCount}
            isActive={activeTab === 'mentions'}
            onClick={() => setActiveTab('mentions')}
          />
          <TabButton
            id="settings"
            label="Settings"
            isActive={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'settings' ? (
          /* Notification Settings */
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Event Reminders</h4>
                  <p className="text-sm text-gray-600">Get notified before events start</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">New Messages</h4>
                  <p className="text-sm text-gray-600">Get notified when you receive new messages</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Mentions & Replies</h4>
                  <p className="text-sm text-gray-600">Get notified when someone mentions you</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Community Updates</h4>
                  <p className="text-sm text-gray-600">Get notified about community announcements</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Achievement Unlocks</h4>
                  <p className="text-sm text-gray-600">Get notified when you earn new achievements</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-medium text-gray-900 mb-4">Notification Timing</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Reminder Timing
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>15 minutes before</option>
                    <option>30 minutes before</option>
                    <option>1 hour before</option>
                    <option>2 hours before</option>
                    <option>1 day before</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quiet Hours
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>None</option>
                    <option>10 PM - 8 AM</option>
                    <option>11 PM - 7 AM</option>
                    <option>9 PM - 9 AM</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Notification List */
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
                <p className="text-gray-600">You're all caught up!</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.read ? 'bg-blue-50 border-r border-t border-b border-blue-200' : 'bg-white border-gray-200'
                  } p-4 rounded-r-lg`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <span className="text-2xl">{notification.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{getTimeAgo(notification.timestamp)}</span>
                          {notification.actionUrl && (
                            <button className="text-blue-600 hover:text-blue-800">
                              View
                            </button>
                          )}
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1 ml-4">
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
