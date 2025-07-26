'use client';

import { useAuthStore } from '@/store/authStore';
import { useFamilyStore } from '@/store/familyStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import FamilyCreationWizard from '@/components/family/FamilyCreationWizard';
import FamilyMemberCard from '@/components/family/FamilyMemberCard';

export default function FamilyPage() {
  const { user, appUser, loading: authLoading } = useAuthStore();
  const {
    currentFamily,
    familyMembers,
    familyPosts,
    loading,
    error,
    fetchFamily,
    fetchFamilyMembers,
    fetchFamilyPosts,
    leaveFamily,
    createFamilyPost,
    generateInviteCode,
    joinByInviteCode
  } = useFamilyStore();
  
  const router = useRouter();
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'feed' | 'events'>('overview');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (appUser) {
      if (appUser.familyId) {
        fetchFamily();
        fetchFamilyMembers();
        fetchFamilyPosts();
      }
    }
  }, [appUser]);

  const handleCreateFamily = (familyId: string) => {
    setShowCreateWizard(false);
    console.log('Family created with ID:', familyId);
  };

  const handleLeaveFamily = async () => {
    if (window.confirm('Are you sure you want to leave your family? This action cannot be undone.')) {
      try {
        await leaveFamily();
      } catch (error) {
        console.error('Error leaving family:', error);
      }
    }
  };

  const handleGenerateInviteCode = async () => {
    try {
      const code = await generateInviteCode();
      setInviteCode(code);
    } catch (error) {
      console.error('Error generating invite code:', error);
    }
  };

  const handleJoinByCode = async () => {
    try {
      await joinByInviteCode(joinCode);
      setShowJoinModal(false);
      setJoinCode('');
    } catch (error) {
      console.error('Error joining family:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    
    try {
      await createFamilyPost(newPostContent, 'update');
      setNewPostContent('');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const getCurrentUserMember = () => {
    return familyMembers.find(member => member.userId === appUser?.uid);
  };

  const canManageFamily = () => {
    const currentMember = getCurrentUserMember();
    return currentMember?.permissions.canManageFamily || false;
  };

  if (authLoading || loading) {
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

  // No family state
  if (!appUser.familyId || !currentFamily) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center">
              <div className="text-8xl mb-6">🏠</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Chosen Family</h1>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Build meaningful relationships that go beyond traditional family structures. 
                Create your chosen family or join an existing one to start your journey.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => setShowCreateWizard(true)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium text-lg"
                >
                  🏗️ Create New Family
                </button>
                
                <span className="text-gray-400">or</span>
                
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-medium text-lg"
                >
                  🔗 Join Existing Family
                </button>
              </div>

              {/* Feature Preview */}
              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl mb-4">👥</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Custom Roles</h3>
                  <p className="text-gray-600 text-sm">Define meaningful relationships with custom roles like chosen parent, soul sibling, or wise mentor.</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">🎉</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Family Events</h3>
                  <p className="text-gray-600 text-sm">Celebrate milestones, create traditions, and build lasting memories together.</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">💝</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Shared Values</h3>
                  <p className="text-gray-600 text-sm">Unite around common values and support each other through life's journey.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Family Wizard */}
        {showCreateWizard && (
          <FamilyCreationWizard
            onComplete={handleCreateFamily}
            onCancel={() => setShowCreateWizard(false)}
          />
        )}

        {/* Join Family Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Join Family</h3>
              <p className="text-gray-600 mb-4">Enter the invite code shared by a family member:</p>
              
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter invite code"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleJoinByCode}
                  disabled={!joinCode.trim() || loading}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Joining...' : 'Join Family'}
                </button>
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinCode('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    );
  }

  // Family dashboard
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Family Header */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentFamily.name}</h1>
                {currentFamily.motto && (
                  <p className="text-gray-600 italic mb-2">"{currentFamily.motto}"</p>
                )}
                {currentFamily.description && (
                  <p className="text-gray-700 mb-4">{currentFamily.description}</p>
                )}
                
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <span>👥 {familyMembers.length} members</span>
                  <span>📅 Created {currentFamily.createdAt.toLocaleDateString()}</span>
                  {currentFamily.isPublic ? (
                    <span>🌍 Public</span>
                  ) : (
                    <span>🔒 Private</span>
                  )}
                </div>

                {/* Family Values */}
                {currentFamily.values && currentFamily.values.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Our Values:</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentFamily.values.map((value, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-2">
                {canManageFamily() && (
                  <button
                    onClick={handleGenerateInviteCode}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                  >
                    📤 Generate Invite Code
                  </button>
                )}
                <button
                  onClick={handleLeaveFamily}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                >
                  🚪 Leave Family
                </button>
              </div>
            </div>

            {/* Invite Code Display */}
            {inviteCode && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">Family Invite Code:</p>
                <code className="text-green-900 font-mono text-lg">{inviteCode}</code>
                <p className="text-green-700 text-sm mt-1">Share this code with people you want to invite to your family</p>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-md mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-8">
                {[
                  { id: 'overview', name: 'Overview', icon: '📊' },
                  { id: 'members', name: 'Members', icon: '👥' },
                  { id: 'feed', name: 'Family Feed', icon: '📝' },
                  { id: 'events', name: 'Events', icon: '🎉' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 text-sm font-medium">Total Members</p>
                          <p className="text-3xl font-bold text-blue-900">{familyMembers.length}</p>
                        </div>
                        <div className="text-4xl">👥</div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium">Family Posts</p>
                          <p className="text-3xl font-bold text-green-900">{familyPosts.length}</p>
                        </div>
                        <div className="text-4xl">📝</div>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-600 text-sm font-medium">Days Together</p>
                          <p className="text-3xl font-bold text-purple-900">
                            {Math.floor((new Date().getTime() - currentFamily.createdAt.getTime()) / (1000 * 60 * 60 * 24))}
                          </p>
                        </div>
                        <div className="text-4xl">📅</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Preview */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    {familyPosts.length > 0 ? (
                      <div className="space-y-4">
                        {familyPosts.slice(0, 3).map((post) => {
                          const author = familyMembers.find(m => m.userId === post.fromUid);
                          return (
                            <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-semibold">
                                    {author?.userName.charAt(0).toUpperCase() || '?'}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">{author?.userName || 'Unknown'}</span>
                                    <span className="text-gray-500 text-sm">
                                      {post.createdAt.toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 mt-1">{post.content}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">📝</div>
                        <p>No posts yet. Start sharing with your family!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Family Members ({familyMembers.length})</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {familyMembers.map((member) => (
                      <FamilyMemberCard
                        key={member.id}
                        member={member}
                        currentUserId={appUser.uid}
                        canManageRoles={canManageFamily()}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Feed Tab */}
              {activeTab === 'feed' && (
                <div className="space-y-6">
                  {/* Create Post */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Share with Your Family</h3>
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="What's on your mind? Share an update, memory, or question with your family..."
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={handleCreatePost}
                        disabled={!newPostContent.trim() || loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                  </div>

                  {/* Posts Feed */}
                  <div className="space-y-4">
                    {familyPosts.map((post) => {
                      const author = familyMembers.find(m => m.userId === post.fromUid);
                      return (
                        <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {author?.userName.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-semibold">{author?.userName || 'Unknown'}</span>
                                <span className="text-gray-500 text-sm">
                                  {post.createdAt.toLocaleDateString()} at {post.createdAt.toLocaleTimeString()}
                                </span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {post.type}
                                </span>
                              </div>
                              <p className="text-gray-700">{post.content}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {familyPosts.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                        <p>Be the first to share something with your family!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Events Tab */}
              {activeTab === 'events' && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-lg font-medium mb-2">Events Coming Soon</h3>
                  <p>Family events and celebrations will be available in the next update!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
