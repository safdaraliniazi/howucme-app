'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import { useMessagingStore } from '@/store/messagingStore';
import { useRelationshipStore } from '@/store/relationshipStore';
import Layout from '@/components/layout/Layout';
import { Button, Card, Badge, LoadingSpinner, LoadingState } from '@/components/ui';
import { AppUser, Relationship } from '@/types';

interface UserProfilePageProps {
  userId?: string;
}

export default function UserProfilePage({ userId: propUserId }: UserProfilePageProps) {
  const params = useParams();
  const router = useRouter();
  const userId = propUserId || (params?.userId as string);
  
  const { user, appUser, loading: authLoading } = useAuthStore();
  const { 
    profileUser, 
    profilePosts, 
    viewContext, 
    loading: profileLoading,
    loadUserProfile,
    loadUserPosts 
  } = useUserProfileStore();
  
  const { createConversation } = useMessagingStore();
  const { 
    sendRelationshipRequest, 
    acceptRequest, 
    rejectRequest,
    relationships 
  } = useRelationshipStore();

  const [requestLoading, setRequestLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('Friend');

  const relationshipLabels = [
    'Friend', 'Best Friend', 'Close Friend', 'Brother', 'Sister', 
    'Father', 'Mother', 'Son', 'Daughter', 'Cousin', 'Uncle', 'Aunt'
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
      return;
    }

    if (userId && appUser) {
      loadUserProfile(userId);
      loadUserPosts(userId);
    }
  }, [userId, appUser, authLoading, user, router, loadUserProfile, loadUserPosts]);

  const handleSendMessage = async () => {
    if (!appUser || !profileUser) return;
    
    try {
      const conversationId = await createConversation([profileUser.uid]);
      router.push(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleSendRelationshipRequest = async () => {
    if (!appUser || !profileUser || !selectedLabel) return;
    
    setRequestLoading(true);
    try {
      await sendRelationshipRequest(profileUser.uid, selectedLabel);
      // Reload profile to update relationship status
      await loadUserProfile(userId);
    } catch (error) {
      console.error('Error sending relationship request:', error);
    } finally {
      setRequestLoading(false);
    }
  };

  const handleAcceptRequest = async (relationshipId: string) => {
    try {
      await acceptRequest(relationshipId);
      await loadUserProfile(userId);
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleRejectRequest = async (relationshipId: string) => {
    try {
      await rejectRequest(relationshipId);
      await loadUserProfile(userId);
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const getRelationshipStatus = (): 'none' | 'pending_sent' | 'pending_received' | 'connected' => {
    if (!appUser || !profileUser) return 'none';
    
    const relationship = relationships.find(r => 
      (r.from === appUser.uid && r.to === profileUser.uid) ||
      (r.from === profileUser.uid && r.to === appUser.uid)
    );

    if (!relationship) return 'none';
    
    if (relationship.status === 'accepted') return 'connected';
    if (relationship.from === appUser.uid) return 'pending_sent';
    return 'pending_received';
  };

  const getPendingRequest = (): Relationship | null => {
    if (!appUser || !profileUser) return null;
    
    return relationships.find(r => 
      r.from === profileUser.uid && 
      r.to === appUser.uid && 
      r.status === 'pending'
    ) || null;
  };

  if (authLoading || profileLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="text-center max-w-md">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600">Loading profile...</p>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!user || !appUser) {
    return null;
  }

  if (!profileUser || !viewContext) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h2>
            <p className="text-gray-600 mb-6">The profile you're looking for doesn't exist or has been removed.</p>
            <Button
              onClick={() => router.back()}
              variant="primary"
            >
              Go Back
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  const relationshipStatus = getRelationshipStatus();
  const pendingRequest = getPendingRequest();
  const isOwnProfile = appUser.uid === profileUser.uid;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Cover Photo Section */}
        <div className="relative">
          <div className="h-48 sm:h-64 bg-gradient-to-r from-blue-400 to-purple-600">
            {profileUser.coverPhotoUrl && (
              <img
                src={profileUser.coverPhotoUrl}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          
          {/* Profile Picture */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-300 overflow-hidden">
              {profileUser.profilePicUrl ? (
                <img
                  src={profileUser.profilePicUrl}
                  alt={profileUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-600">
                  {profileUser.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
          {/* Basic Info */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{profileUser.name}</h1>
            
            {viewContext.canViewBio && profileUser.bio && (
              <p className="text-gray-600 mb-4 max-w-2xl mx-auto">{profileUser.bio}</p>
            )}

            {viewContext.canViewProfile && (
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 mb-6">
                {profileUser.location && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {profileUser.location}
                  </span>
                )}
                {profileUser.website && (
                  <a href={profileUser.website} target="_blank" rel="noopener noreferrer" 
                     className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Website
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Joined {new Date(profileUser.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            {!isOwnProfile && (
              <div className="flex justify-center gap-4 mb-8">
                {/* Message Button */}
                {viewContext.canMessage && (
                  <Button
                    onClick={handleSendMessage}
                    variant="primary"
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.001 8.001 0 01-7.003-4.165c-.35-.566-.535-1.216-.535-1.835 0-1.657 1.343-3 3-3h.28a1 1 0 01.95.694l.007.022a1 1 0 00.95.694H10a3 3 0 003-3V7a8 8 0 018 5z" />
                      </svg>
                    }
                  >
                    Message
                  </Button>
                )}

                {/* Relationship Action Button */}
                {relationshipStatus === 'none' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedLabel}
                      onChange={(e) => setSelectedLabel(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {relationshipLabels.map(label => (
                        <option key={label} value={label}>{label}</option>
                      ))}
                    </select>
                    <Button
                      onClick={handleSendRelationshipRequest}
                      disabled={requestLoading}
                      variant="success"
                      isLoading={requestLoading}
                      leftIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      }
                    >
                      Connect
                    </Button>
                  </div>
                )}

                {relationshipStatus === 'pending_sent' && (
                  <Badge variant="warning" size="lg" className="px-4 py-2">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Request Sent
                  </Badge>
                )}

                {relationshipStatus === 'pending_received' && pendingRequest && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAcceptRequest(pendingRequest.id)}
                      variant="success"
                      leftIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      }
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleRejectRequest(pendingRequest.id)}
                      variant="secondary"
                      leftIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      }
                    >
                      Decline
                    </Button>
                  </div>
                )}

                {relationshipStatus === 'connected' && (
                  <Badge variant="success" size="lg" className="px-4 py-2">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Connected
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Privacy Notice */}
          {!viewContext.canViewPosts && !isOwnProfile && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center mb-8">
              <svg className="w-12 h-12 text-yellow-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Private Profile</h3>
              <p className="text-yellow-700">
                This user's posts are private. 
                {relationshipStatus === 'none' && ' Send a connection request to see their content.'}
                {relationshipStatus === 'pending_sent' && ' Your connection request is pending.'}
              </p>
            </div>
          )}

          {/* Posts Section */}
          {viewContext.canViewPosts && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isOwnProfile ? 'Your Posts' : `${profileUser.name}'s Posts`}
              </h2>
              
              {profilePosts.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-500">
                    {isOwnProfile ? "Share your first post!" : `${profileUser.name} hasn't shared any posts yet.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {profilePosts.map((post) => (
                    <div key={post.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                          {profileUser.profilePicUrl ? (
                            <img
                              src={profileUser.profilePicUrl}
                              alt={profileUser.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-600">
                              {profileUser.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{profileUser.name}</h3>
                            <span className="text-gray-500 text-sm">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-800 whitespace-pre-wrap">{post.text}</p>
                          
                          {post.mediaUrl && (
                            <div className="mt-4">
                              {post.mediaType === 'image' ? (
                                <img
                                  src={post.mediaUrl}
                                  alt="Post media"
                                  className="rounded-lg max-w-full h-auto"
                                />
                              ) : (
                                <video
                                  src={post.mediaUrl}
                                  controls
                                  className="rounded-lg max-w-full h-auto"
                                />
                              )}
                            </div>
                          )}

                          {/* Reactions */}
                          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                            {Object.entries(post.reactions).map(([reaction, count]) => (
                              <span key={reaction} className="text-sm text-gray-600 flex items-center gap-1">
                                <span className="text-lg">
                                  {reaction === 'heart' && '❤️'}
                                  {reaction === 'sparkles' && '✨'}
                                  {reaction === 'clap' && '👏'}
                                  {reaction === 'star' && '⭐'}
                                </span>
                                {count}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
