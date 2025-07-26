'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useMessagingStore } from '@/store/messagingStore';
import { Conversation } from '@/types';

interface MessageUserButtonProps {
  userId: string;
  userName: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function MessageUserButton({ 
  userId, 
  userName, 
  variant = 'primary',
  size = 'md',
  className = ''
}: MessageUserButtonProps) {
  const { appUser } = useAuthStore();
  const { createConversation, findExistingConversation } = useMessagingStore();
  const router = useRouter();

  const handleMessageUser = async () => {
    if (!appUser || userId === appUser.uid) return;

    try {
      // Check if conversation already exists
      const existingConversation = await findExistingConversation([appUser.uid, userId]);
      
      if (existingConversation) {
        // Redirect to existing conversation
        router.push(`/messages?conversation=${existingConversation.id}`);
      } else {
        // Create new conversation
        const participants = [appUser.uid, userId];
        await createConversation(participants);
        
        // Redirect to messages page where new conversation will appear
        router.push('/messages');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  if (!appUser || userId === appUser.uid) return null;

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
    ghost: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={handleMessageUser}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      title={`Send message to ${userName}`}
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      Message
    </button>
  );
}
