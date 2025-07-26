'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useMessagingStore } from '@/store/messagingStore';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Conversation } from '@/types';
import UserCard from '@/components/profile/UserCard';
import { Button, Input, LoadingSpinner, Card } from '@/components/ui';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartConversation: (conversation: Conversation) => void;
}

export default function NewMessageModal({ isOpen, onClose, onStartConversation }: NewMessageModalProps) {
  const { appUser } = useAuthStore();
  const { createConversation } = useMessagingStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [realUsers, setRealUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  useEffect(() => {
    if (isOpen && appUser) {
      fetchRealUsers();
    }
  }, [isOpen, appUser]);

  const fetchRealUsers = async () => {
    setFetchingUsers(true);
    try {
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const users: any[] = [];
      
      usersSnapshot.docs
        .filter(doc => doc.data().uid !== appUser!.uid)
        .slice(0, 20)
        .forEach(doc => {
          const userData = doc.data();
          if (userData.name && userData.uid) {
            users.push({
              uid: userData.uid,
              name: userData.name,
              email: userData.email || '',
              bio: userData.bio || '',
              profilePicUrl: userData.profilePicUrl || '',
              location: userData.location || '',
              createdAt: userData.createdAt || new Date()
            });
          }
        });
      
      setRealUsers(users);
    } catch (error) {
      console.error('Error fetching real users:', error);
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleStartConversation = async (targetUser: any) => {
    if (!appUser) return;

    setLoading(true);
    try {
      const conversationId = await createConversation([targetUser.uid]);
      
      const conversation: Conversation = {
        id: conversationId,
        participants: [appUser.uid, targetUser.uid],
        participantNames: [appUser.name, targetUser.name],
        participantAvatars: [appUser.profilePicUrl || '', targetUser.profilePicUrl || ''],
        lastMessage: {
          content: 'Conversation started',
          fromUserId: appUser.uid,
          fromUserName: appUser.name,
          timestamp: new Date(),
          type: 'system'
        },
        updatedAt: new Date(),
        isGroupChat: false,
        createdAt: new Date(),
        createdBy: appUser.uid
      };

      onStartConversation(conversation);
      setSearchTerm('');
      onClose();
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = realUsers.filter((user: any) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-white" padding="none">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Start New Conversation</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="p-6 border-b border-gray-200">
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {fetchingUsers ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-600">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-gray-500">
                {searchTerm ? 'No users found matching your search.' : 'No users available.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user: any) => (
                <div
                  key={user.uid}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <UserCard
                    user={user}
                    showMessageButton={false}
                    showConnectButton={false}
                    compact={true}
                  />
                  <Button
                    onClick={() => handleStartConversation(user)}
                    disabled={loading}
                    variant="primary"
                    size="sm"
                    isLoading={loading}
                  >
                    Message
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
