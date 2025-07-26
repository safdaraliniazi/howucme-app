'use client';

import { useAuthStore } from '@/store/authStore';
import { useCommunityStore } from '@/store/communityStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/layout/Layout';

export default function CommunityDetailPage() {
  const { user, appUser, loading: authLoading } = useAuthStore();
  const {
    currentCommunity,
    communityMembers,
    communityPosts,
    communityEvents,
    loading,
    error,
    fetchCommunity,
    fetchCommunityMembers,
    fetchCommunityPosts,
    fetchCommunityEvents,
    createCommunityPost,
    joinCommunity,
    leaveCommunity
  } = useCommunityStore();
  
  const router = useRouter();
  const params = useParams();
  const communityId = params?.id as string;
  
  const [activeTab, setActiveTab] = useState<'posts' | 'members' | 'events' | 'about'>('posts');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<'discussion' | 'question' | 'announcement' | 'event' | 'resource'>('discussion');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (communityId && appUser) {
      fetchCommunity(communityId);
      fetchCommunityPosts(communityId);
      fetchCommunityEvents(communityId);
    }
  }, [communityId, appUser]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !currentCommunity) return;
    
    try {
      await createCommunityPost(currentCommunity.id, newPostContent, newPostType);
      setNewPostContent('');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleJoinCommunity = async () => {
    if (!currentCommunity) return;
    
    try {
      await joinCommunity(currentCommunity.id);
      // Refresh community data
      await fetchCommunity(currentCommunity.id);
    } catch (error) {
      console.error('Error joining community:', error);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!currentCommunity) return;
    
    if (window.confirm('Are you sure you want to leave this community?')) {
      try {
        await leaveCommunity(currentCommunity.id);
        router.push('/communities');
      } catch (error) {
        console.error('Error leaving community:', error);
      }
    }
  };

  const isUserMember = () => {
    return communityMembers.some(member => member.userId === appUser?.uid);
  };

  const getCurrentUserMember = () => {
    return communityMembers.find(member => member.userId === appUser?.uid);
  };

  const canManageCommunity = () => {
    const currentMember = getCurrentUserMember();
    return currentMember?.permissions.canManageCommunity || false;
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading community...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user || !appUser || !currentCommunity) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Community Not Found</h2>
            <p className="text-gray-600 mb-4">The community you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => router.push('/communities')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Browse Communities
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Community Header */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-6">
                <div className={`w-20 h-20 ${currentCommunity.category.color} rounded-xl flex items-center justify-center text-4xl`}>
                  {currentCommunity.category.icon}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentCommunity.name}</h1>
                  <p className="text-lg text-gray-600 mb-2">{currentCommunity.category.name}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span>👥 {currentCommunity.memberCount} members</span>
                    <span>🕒 Active {currentCommunity.lastActivity.toLocaleDateString()}</span>
                    <span>{currentCommunity.isPublic ? '🌍 Public' : '🔒 Private'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                {isUserMember() ? (
                  <>
                    <button
                      onClick={handleLeaveCommunity}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-medium"
                    >
                      Leave Community
                    </button>
                    {canManageCommunity() && (
                      <button
                        onClick={() => router.push(`/communities/${currentCommunity.id}/manage`)}
                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 font-medium"
                      >
                        Manage
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={handleJoinCommunity}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Join Community
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-gray-700 mb-4">{currentCommunity.description}</p>
              
              {currentCommunity.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentCommunity.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-md mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-8">
                {[
                  { id: 'posts', name: 'Posts', icon: '📝', count: communityPosts.length },
                  { id: 'members', name: 'Members', icon: '👥', count: communityMembers.length },
                  { id: 'events', name: 'Events', icon: '📅', count: communityEvents.length },
                  { id: 'about', name: 'About', icon: 'ℹ️', count: null }
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
                    <div className="flex items-center space-x-2">
                      <span>{tab.icon}</span>
                      <span>{tab.name}</span>
                      {tab.count !== null && (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                          {tab.count}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              {/* Posts Tab */}
              {activeTab === 'posts' && (
                <div className="space-y-6">
                  {/* Create Post - Only for members */}
                  {isUserMember() && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Share with the Community</h3>
                      
                      <div className="mb-4">
                        <select
                          value={newPostType}
                          onChange={(e) => setNewPostType(e.target.value as any)}
                          className="mb-3 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="discussion">💬 Discussion</option>
                          <option value="question">❓ Question</option>
                          <option value="announcement">📢 Announcement</option>
                          <option value="resource">📚 Resource</option>
                          <option value="event">📅 Event</option>
                        </select>
                        
                        <textarea
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          placeholder="What would you like to share with the community?"
                          rows={4}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          onClick={handleCreatePost}
                          disabled={!newPostContent.trim() || loading}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                        >
                          {loading ? 'Posting...' : 'Post'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Posts Feed */}
                  <div className="space-y-4">
                    {communityPosts.map((post) => {
                      const author = communityMembers.find(m => m.userId === post.fromUid);
                      const postTypeEmojis = {
                        discussion: '💬',
                        question: '❓',
                        announcement: '📢',
                        resource: '📚',
                        event: '📅'
                      };

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
                                  {postTypeEmojis[post.type]} {post.type}
                                </span>
                                {post.isPinned && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                    📌 Pinned
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-700">{post.content}</p>
                              
                              {post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {post.tags.map((tag, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {communityPosts.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                        <p>Be the first to share something with this community!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div>
                  <h3 className="text-lg font-semibold mb-6">Community Members ({communityMembers.length})</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {communityMembers.map((member) => (
                      <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {member.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{member.userName}</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">{member.role.icon} {member.role.name}</span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Joined {member.joinedAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events Tab */}
              {activeTab === 'events' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Community Events ({communityEvents.length})</h3>
                    {isUserMember() && (
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                        📅 Create Event
                      </button>
                    )}
                  </div>

                  {communityEvents.length > 0 ? (
                    <div className="space-y-4">
                      {communityEvents.filter(event => event.communityId === currentCommunity.id).map((event) => (
                        <div key={event.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">{event.title}</h4>
                              <p className="text-gray-700 mb-3">{event.description}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>📅 {event.dateTime.toLocaleDateString()}</span>
                                <span>🕒 {event.dateTime.toLocaleTimeString()}</span>
                                <span>📍 {event.location.type}</span>
                                <span>👥 {event.attendees.length} attending</span>
                              </div>
                            </div>
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                              RSVP
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">📅</div>
                      <h3 className="text-lg font-medium mb-2">No events yet</h3>
                      <p>Events and meetups will appear here!</p>
                    </div>
                  )}
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">About This Community</h3>
                    <p className="text-gray-700">{currentCommunity.description}</p>
                  </div>

                  {currentCommunity.welcomeMessage && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Welcome Message</h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800">{currentCommunity.welcomeMessage}</p>
                      </div>
                    </div>
                  )}

                  {currentCommunity.rules.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Community Rules</h3>
                      <div className="space-y-2">
                        {currentCommunity.rules.map((rule, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <p className="text-gray-700">{rule}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Community Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">{currentCommunity.memberCount}</div>
                        <div className="text-sm text-gray-600">Members</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">{communityPosts.length}</div>
                        <div className="text-sm text-gray-600">Posts</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">{communityEvents.length}</div>
                        <div className="text-sm text-gray-600">Events</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {Math.floor((new Date().getTime() - currentCommunity.createdAt.getTime()) / (1000 * 60 * 60 * 24))}
                        </div>
                        <div className="text-sm text-gray-600">Days Active</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
