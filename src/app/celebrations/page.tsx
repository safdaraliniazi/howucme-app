'use client';

import { useAuthStore } from '@/store/authStore';
import { useCelebrationStore } from '@/store/celebrationStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';

export default function CelebrationsPage() {
  const { user, appUser, loading: authLoading } = useAuthStore();
  const {
    celebrations,
    upcomingCelebrations,
    loading,
    createCelebration,
    fetchCelebrations,
    fetchUpcomingCelebrations,
    joinCelebration
  } = useCelebrationStore();
  
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'all' | 'create'>('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state for creating celebrations
  const [newCelebration, setNewCelebration] = useState({
    type: 'birthday' as const,
    title: '',
    description: '',
    date: '',
    userId: '',
    isPublic: true,
    reminderSet: false
  });

  const celebrationTypes = [
    { id: 'birthday', name: 'Birthday', icon: '🎂' },
    { id: 'anniversary', name: 'Anniversary', icon: '💕' },
    { id: 'milestone', name: 'Milestone', icon: '🎯' },
    { id: 'achievement', name: 'Achievement', icon: '🏆' },
    { id: 'custom', name: 'Custom', icon: '🎉' }
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (appUser) {
      fetchCelebrations();
      fetchUpcomingCelebrations();
    }
  }, [appUser]);

  const handleCreateCelebration = async () => {
    if (!newCelebration.title || !newCelebration.date || !newCelebration.userId || !appUser) {
      return;
    }

    try {
      await createCelebration({
        type: newCelebration.type,
        title: newCelebration.title,
        description: newCelebration.description,
        date: new Date(newCelebration.date),
        userId: newCelebration.userId,
        createdBy: appUser.uid,
        participants: [newCelebration.userId],
        isPublic: newCelebration.isPublic,
        reminderSet: newCelebration.reminderSet
      });

      // Reset form and close modal
      setNewCelebration({
        type: 'birthday',
        title: '',
        description: '',
        date: '',
        userId: '',
        isPublic: true,
        reminderSet: false
      });
      setShowCreateModal(false);
      setActiveTab('upcoming');
    } catch (error) {
      console.error('Error creating celebration:', error);
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    return date.toLocaleDateString();
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading celebrations...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Celebrations</h1>
          <p className="text-gray-600">Celebrate milestones and special moments with your chosen family</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upcoming ({upcomingCelebrations.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Celebrations ({celebrations.length})
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              + Create Celebration
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'upcoming' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Upcoming Celebrations</h2>
            {upcomingCelebrations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming celebrations</h3>
                <p className="text-gray-500 mb-4">Create a celebration to get started!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Celebration
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {upcomingCelebrations.map((celebration) => (
                  <div key={celebration.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="text-4xl">
                          {celebrationTypes.find(t => t.id === celebration.type)?.icon || '🎉'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">{celebration.title}</h3>
                          {celebration.description && (
                            <p className="text-gray-600 mt-1">{celebration.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>📅 {formatDate(celebration.date)}</span>
                            <span>👥 {celebration.participants.length} participating</span>
                            {celebration.isPublic && <span>🌍 Public</span>}
                          </div>
                        </div>
                      </div>
                      {!celebration.participants.includes(appUser.uid) && (
                        <button
                          onClick={() => joinCelebration(celebration.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'all' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">All Celebrations</h2>
            {celebrations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No celebrations yet</h3>
                <p className="text-gray-500">Start celebrating special moments with your community!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {celebrations.map((celebration) => (
                  <div key={celebration.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex items-start space-x-4">
                      <div className="text-4xl">
                        {celebrationTypes.find(t => t.id === celebration.type)?.icon || '🎉'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{celebration.title}</h3>
                        {celebration.description && (
                          <p className="text-gray-600 mt-1">{celebration.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>📅 {celebration.date.toLocaleDateString()}</span>
                          <span>👥 {celebration.participants.length} participated</span>
                          {celebration.isPublic && <span>🌍 Public</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Celebration Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Create New Celebration</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Celebration Type
                  </label>
                  <select
                    value={newCelebration.type}
                    onChange={(e) => setNewCelebration({
                      ...newCelebration,
                      type: e.target.value as any
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {celebrationTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.icon} {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newCelebration.title}
                    onChange={(e) => setNewCelebration({
                      ...newCelebration,
                      title: e.target.value
                    })}
                    placeholder="e.g., John's Birthday"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={newCelebration.description}
                    onChange={(e) => setNewCelebration({
                      ...newCelebration,
                      description: e.target.value
                    })}
                    placeholder="Add details about the celebration..."
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newCelebration.date}
                    onChange={(e) => setNewCelebration({
                      ...newCelebration,
                      date: e.target.value
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Who are we celebrating?
                  </label>
                  <input
                    type="text"
                    value={newCelebration.userId}
                    onChange={(e) => setNewCelebration({
                      ...newCelebration,
                      userId: e.target.value
                    })}
                    placeholder="User ID (for now - will be dropdown later)"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For now, use the user ID. We'll add a user selector later.
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newCelebration.isPublic}
                      onChange={(e) => setNewCelebration({
                        ...newCelebration,
                        isPublic: e.target.checked
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Public celebration</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newCelebration.reminderSet}
                      onChange={(e) => setNewCelebration({
                        ...newCelebration,
                        reminderSet: e.target.checked
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Set reminder</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleCreateCelebration}
                  disabled={!newCelebration.title || !newCelebration.date || !newCelebration.userId}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Celebration
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
