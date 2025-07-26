'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useMessagingStore } from '@/store/messagingStore';
import { useRelationshipStore } from '@/store/relationshipStore';
import { AppUser, Relationship } from '@/types';

interface UserCardProps {
  user: AppUser;
  relationship?: Relationship;
  showMessageButton?: boolean;
  showConnectButton?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export default function UserCard({ 
  user, 
  relationship, 
  showMessageButton = true, 
  showConnectButton = true,
  compact = false,
  onClick 
}: UserCardProps) {
  const router = useRouter();
  const { appUser } = useAuthStore();
  const { createConversation } = useMessagingStore();
  const { sendRelationshipRequest } = useRelationshipStore();
  
  const [connecting, setConnecting] = useState(false);
  const [messaging, setMessaging] = useState(false);

  const isOwnProfile = appUser?.uid === user.uid;
  const hasRelationship = relationship && relationship.status === 'accepted';
  const hasPendingRequest = relationship && relationship.status === 'pending';

  const handleViewProfile = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/profile/${user.uid}`);
    }
  };

  const handleSendMessage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!appUser || messaging) return;
    
    setMessaging(true);
    try {
      const conversationId = await createConversation([user.uid]);
      router.push(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setMessaging(false);
    }
  };

  const handleConnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!appUser || connecting) return;
    
    setConnecting(true);
    try {
      await sendRelationshipRequest(user.uid, 'Friend');
    } catch (error) {
      console.error('Error sending connection request:', error);
    } finally {
      setConnecting(false);
    }
  };

  if (compact) {
    return (
      <div 
        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
        onClick={handleViewProfile}
      >
        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
          {user.profilePicUrl ? (
            <img
              src={user.profilePicUrl}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-600">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{user.name}</h3>
          {hasRelationship && (
            <p className="text-sm text-green-600">{relationship.label}</p>
          )}
          {hasPendingRequest && (
            <p className="text-sm text-yellow-600">Request Pending</p>
          )}
        </div>
        
        {!isOwnProfile && (
          <div className="flex gap-2">
            {showMessageButton && (hasRelationship || user.allowMessagesFromStrangers !== false) && (
              <button
                onClick={handleSendMessage}
                disabled={messaging}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                title="Send Message"
              >
                {messaging ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.001 8.001 0 01-7.003-4.165c-.35-.566-.535-1.216-.535-1.835 0-1.657 1.343-3 3-3h.28a1 1 0 01.95.694l.007.022a1 1 0 00.95.694H10a3 3 0 003-3V7a8 8 0 018 5z" />
                  </svg>
                )}
              </button>
            )}
            
            {showConnectButton && !hasRelationship && !hasPendingRequest && (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                title="Connect"
              >
                {connecting ? (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div 
        className="p-6 cursor-pointer"
        onClick={handleViewProfile}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
            {user.profilePicUrl ? (
              <img
                src={user.profilePicUrl}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-600">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{user.name}</h3>
            {user.bio && (
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">{user.bio}</p>
            )}
            {hasRelationship && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                {relationship.label}
              </span>
            )}
            {hasPendingRequest && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                Request Pending
              </span>
            )}
            {user.location && (
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {user.location}
              </p>
            )}
          </div>
        </div>
      </div>

      {!isOwnProfile && (showMessageButton || showConnectButton) && (
        <div className="px-6 pb-6 flex gap-3">
          {showMessageButton && (hasRelationship || user.allowMessagesFromStrangers !== false) && (
            <button
              onClick={handleSendMessage}
              disabled={messaging}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {messaging ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.001 8.001 0 01-7.003-4.165c-.35-.566-.535-1.216-.535-1.835 0-1.657 1.343-3 3-3h.28a1 1 0 01.95.694l.007.022a1 1 0 00.95.694H10a3 3 0 003-3V7a8 8 0 018 5z" />
                  </svg>
                  Message
                </>
              )}
            </button>
          )}
          
          {showConnectButton && !hasRelationship && !hasPendingRequest && (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {connecting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Connect
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
