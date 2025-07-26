import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp,
  limit,
  getDoc,
  orderBy,
  onSnapshot,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from './authStore';
import { 
  Conversation, 
  Message, 
  MessageAttachment, 
  MessageReadReceipt,
  MessageReaction,
  AppUser 
} from '@/types';

interface MessagingState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: { [conversationId: string]: Message[] };
  onlineUsers: string[];
  typingUsers: { [conversationId: string]: string[] };
  unreadCounts: { [conversationId: string]: number };
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchConversations: () => Promise<void>;
  createConversation: (participantIds: string[], isGroupChat?: boolean, groupName?: string, communityContext?: any) => Promise<string>;
  sendMessage: (conversationId: string, content: string, type?: Message['type'], replyTo?: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  setTyping: (conversationId: string, isTyping: boolean) => Promise<void>;
  subscribeToConversation: (conversationId: string) => () => void;
  subscribeToConversations: () => () => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  searchMessages: (conversationId: string, searchQuery: string) => Promise<Message[]>;
  findExistingConversation: (participantIds: string[]) => Promise<Conversation | null>;
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: {},
  onlineUsers: [],
  typingUsers: {},
  unreadCounts: {},
  loading: false,
  error: null,

  fetchConversations: async () => {
    try {
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) return;

      set({ loading: true, error: null });

      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUser.uid),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const conversations: Conversation[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        conversations.push({
          id: doc.id,
          participants: data.participants,
          participantNames: data.participantNames,
          participantAvatars: data.participantAvatars || [],
          lastMessage: {
            content: data.lastMessage?.content || '',
            fromUserId: data.lastMessage?.fromUserId || '',
            fromUserName: data.lastMessage?.fromUserName || '',
            timestamp: data.lastMessage?.timestamp?.toDate() || new Date(),
            type: data.lastMessage?.type || 'text'
          },
          updatedAt: data.updatedAt?.toDate() || new Date(),
          isGroupChat: data.isGroupChat || false,
          groupName: data.groupName,
          groupAvatar: data.groupAvatar,
          communityContext: data.communityContext,
          createdAt: data.createdAt?.toDate() || new Date(),
          createdBy: data.createdBy
        });
      });

      // Sort conversations by updatedAt in memory (newest first)
      conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      set({ conversations });
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  createConversation: async (participantIds: string[], isGroupChat = false, groupName?: string, communityContext?: any) => {
    try {
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to create conversations');
      }

      set({ loading: true, error: null });

      // Include current user in participants
      const allParticipants = [...new Set([currentUser.uid, ...participantIds])];

      // For direct conversations, check if one already exists
      if (!isGroupChat && allParticipants.length === 2) {
        const existingQuery = query(
          collection(db, 'conversations'),
          where('participants', '==', allParticipants),
          where('isGroupChat', '==', false)
        );

        const existingSnapshot = await getDocs(existingQuery);
        if (!existingSnapshot.empty) {
          const existingConversation = existingSnapshot.docs[0];
          return existingConversation.id;
        }
      }

      // Fetch participant details
      const participantDetails = await Promise.all(
        allParticipants.map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
              uid,
              name: userData.name,
              avatar: userData.profilePicUrl || ''
            };
          }
          return { uid, name: 'Unknown User', avatar: '' };
        })
      );

      const conversationData: any = {
        participants: allParticipants,
        participantNames: participantDetails.map(p => p.name),
        participantAvatars: participantDetails.map(p => p.avatar),
        lastMessage: {
          content: isGroupChat ? `${currentUser.name} created the group` : '',
          fromUserId: currentUser.uid,
          fromUserName: currentUser.name,
          timestamp: new Date(),
          type: 'system'
        },
        updatedAt: serverTimestamp(),
        isGroupChat,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid
      };

      // Only include groupName if it's a group chat to avoid undefined values
      if (isGroupChat && groupName) {
        conversationData.groupName = groupName;
      }

      // Only include communityContext if it exists
      if (communityContext) {
        conversationData.communityContext = communityContext;
      }

      const conversationRef = await addDoc(collection(db, 'conversations'), conversationData);

      // If it's a group chat, send a system message
      if (isGroupChat) {
        await addDoc(collection(db, 'messages'), {
          conversationId: conversationRef.id,
          fromUserId: currentUser.uid,
          fromUserName: currentUser.name,
          content: `${currentUser.name} created the group "${groupName}"`,
          type: 'system',
          readBy: [{ userId: currentUser.uid, readAt: new Date() }],
          createdAt: serverTimestamp()
        });
      }

      console.log('Conversation created:', conversationRef.id);
      
      // Refresh conversations
      await get().fetchConversations();
      
      return conversationRef.id;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  sendMessage: async (conversationId: string, content: string, type: Message['type'] = 'text', replyTo?: string) => {
    try {
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to send messages');
      }

      const messageData: any = {
        conversationId,
        fromUserId: currentUser.uid,
        fromUserName: currentUser.name,
        fromUserAvatar: currentUser.profilePicUrl || '',
        content: content.trim(),
        type,
        readBy: [{ userId: currentUser.uid, readAt: new Date() }],
        createdAt: serverTimestamp()
      };

      // Add reply information if replying
      if (replyTo) {
        const { messages } = get();
        const conversationMessages = messages[conversationId] || [];
        const replyToMessage = conversationMessages.find(m => m.id === replyTo);
        
        if (replyToMessage) {
          messageData.replyTo = {
            messageId: replyTo,
            content: replyToMessage.content.substring(0, 100), // Truncate for display
            fromUserName: replyToMessage.fromUserName
          };
        }
      }

      // Send message
      await addDoc(collection(db, 'messages'), messageData);

      // Update conversation's last message
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: {
          content: content.substring(0, 100),
          fromUserId: currentUser.uid,
          fromUserName: currentUser.name,
          timestamp: new Date(),
          type
        },
        updatedAt: serverTimestamp()
      });

      console.log('Message sent to conversation:', conversationId);
    } catch (error: any) {
      console.error('Error sending message:', error);
      set({ error: error.message });
      throw error;
    }
  },

  editMessage: async (messageId: string, newContent: string) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        content: newContent.trim(),
        editedAt: serverTimestamp()
      });

      // Update local state
      const { messages } = get();
      const updatedMessages = { ...messages };
      
      Object.keys(updatedMessages).forEach(conversationId => {
        updatedMessages[conversationId] = updatedMessages[conversationId].map(message =>
          message.id === messageId 
            ? { ...message, content: newContent.trim(), editedAt: new Date() }
            : message
        );
      });

      set({ messages: updatedMessages });

      console.log('Message edited:', messageId);
    } catch (error: any) {
      console.error('Error editing message:', error);
      set({ error: error.message });
      throw error;
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        content: 'This message was deleted',
        type: 'system',
        editedAt: serverTimestamp()
      });

      // Update local state
      const { messages } = get();
      const updatedMessages = { ...messages };
      
      Object.keys(updatedMessages).forEach(conversationId => {
        updatedMessages[conversationId] = updatedMessages[conversationId].map(message =>
          message.id === messageId 
            ? { ...message, content: 'This message was deleted', type: 'system', editedAt: new Date() }
            : message
        );
      });

      set({ messages: updatedMessages });

      console.log('Message deleted:', messageId);
    } catch (error: any) {
      console.error('Error deleting message:', error);
      set({ error: error.message });
      throw error;
    }
  },

  addReaction: async (messageId: string, emoji: string) => {
    try {
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to react');
      }

      await updateDoc(doc(db, 'messages', messageId), {
        [`reactions.${emoji}.users`]: arrayUnion(currentUser.uid)
      });

      console.log('Reaction added to message:', messageId);
    } catch (error: any) {
      console.error('Error adding reaction:', error);
      set({ error: error.message });
      throw error;
    }
  },

  removeReaction: async (messageId: string, emoji: string) => {
    try {
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to remove reaction');
      }

      await updateDoc(doc(db, 'messages', messageId), {
        [`reactions.${emoji}.users`]: arrayRemove(currentUser.uid)
      });

      console.log('Reaction removed from message:', messageId);
    } catch (error: any) {
      console.error('Error removing reaction:', error);
      set({ error: error.message });
      throw error;
    }
  },

  markAsRead: async (conversationId: string) => {
    try {
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) return;

      // Get unread messages in this conversation
      const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.forEach((docSnapshot) => {
        const messageData = docSnapshot.data();
        const readBy = messageData.readBy || [];
        
        // Check if user hasn't read this message yet
        const hasRead = readBy.some((r: MessageReadReceipt) => r.userId === currentUser.uid);
        
        if (!hasRead) {
          batch.update(docSnapshot.ref, {
            readBy: arrayUnion({ userId: currentUser.uid, readAt: new Date() })
          });
        }
      });

      await batch.commit();

      // Update unread count
      const { unreadCounts } = get();
      set({ 
        unreadCounts: { 
          ...unreadCounts, 
          [conversationId]: 0 
        }
      });

      console.log('Messages marked as read for conversation:', conversationId);
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
      set({ error: error.message });
    }
  },

  setTyping: async (conversationId: string, isTyping: boolean) => {
    try {
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) return;

      await updateDoc(doc(db, 'conversations', conversationId), {
        [`typing.${currentUser.uid}`]: isTyping ? serverTimestamp() : null
      });

      console.log('Typing status updated:', isTyping);
    } catch (error: any) {
      console.error('Error updating typing status:', error);
    }
  },

  subscribeToConversation: (conversationId: string) => {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        messages.push({
          id: doc.id,
          conversationId: data.conversationId,
          fromUserId: data.fromUserId,
          fromUserName: data.fromUserName,
          fromUserAvatar: data.fromUserAvatar,
          content: data.content,
          type: data.type,
          attachments: data.attachments || [],
          readBy: data.readBy || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          editedAt: data.editedAt?.toDate(),
          replyTo: data.replyTo,
          reactions: data.reactions || []
        });
      });

      // Sort by date in memory (oldest first for chat display)
      messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const { messages: currentMessages } = get();
      set({ 
        messages: { 
          ...currentMessages, 
          [conversationId]: messages 
        }
      });
    });

    return unsubscribe;
  },

  subscribeToConversations: () => {
    const currentUser = useAuthStore.getState().appUser;
    
    if (!currentUser) return () => {};

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversations: Conversation[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        conversations.push({
          id: doc.id,
          participants: data.participants,
          participantNames: data.participantNames,
          participantAvatars: data.participantAvatars || [],
          lastMessage: {
            content: data.lastMessage?.content || '',
            fromUserId: data.lastMessage?.fromUserId || '',
            fromUserName: data.lastMessage?.fromUserName || '',
            timestamp: data.lastMessage?.timestamp?.toDate() || new Date(),
            type: data.lastMessage?.type || 'text'
          },
          updatedAt: data.updatedAt?.toDate() || new Date(),
          isGroupChat: data.isGroupChat || false,
          groupName: data.groupName,
          groupAvatar: data.groupAvatar,
          communityContext: data.communityContext,
          createdAt: data.createdAt?.toDate() || new Date(),
          createdBy: data.createdBy
        });
      });

      // Sort conversations by updatedAt in memory (newest first)
      conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      set({ conversations });
    });

    return unsubscribe;
  },

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation });
  },

  searchMessages: async (conversationId: string, searchQuery: string) => {
    try {
      const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId)
      );

      const querySnapshot = await getDocs(q);
      const messages: Message[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        const message = {
          id: doc.id,
          conversationId: data.conversationId,
          fromUserId: data.fromUserId,
          fromUserName: data.fromUserName,
          fromUserAvatar: data.fromUserAvatar,
          content: data.content,
          type: data.type,
          attachments: data.attachments || [],
          readBy: data.readBy || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          editedAt: data.editedAt?.toDate(),
          replyTo: data.replyTo,
          reactions: data.reactions || []
        };

        // Filter by search query
        if (message.content.toLowerCase().includes(searchQuery.toLowerCase())) {
          messages.push(message);
        }
      });

      // Sort by date
      messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return messages;
    } catch (error: any) {
      console.error('Error searching messages:', error);
      return [];
    }
  },

  findExistingConversation: async (participantIds: string[]) => {
    try {
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) return null;

      // Sort participant IDs to ensure consistent matching
      const sortedParticipants = [...participantIds].sort();

      // Query for conversations with exactly these participants
      const q = query(
        collection(db, 'conversations'),
        where('participants', '==', sortedParticipants)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      // Return the first matching conversation
      const doc = querySnapshot.docs[0];
      const data = doc.data() as any;

      return {
        id: doc.id,
        participants: data.participants,
        participantNames: data.participantNames,
        participantAvatars: data.participantAvatars || [],
        lastMessage: data.lastMessage ? {
          content: data.lastMessage.content,
          fromUserId: data.lastMessage.fromUserId,
          fromUserName: data.lastMessage.fromUserName,
          timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
          type: data.lastMessage.type || 'text'
        } : {
          content: '',
          fromUserId: '',
          fromUserName: '',
          timestamp: new Date(),
          type: 'text' as const
        },
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isGroupChat: data.isGroupChat || false,
        groupName: data.groupName,
        groupAvatar: data.groupAvatar,
        communityContext: data.communityContext,
        createdAt: data.createdAt?.toDate() || new Date(),
        createdBy: data.createdBy
      } as Conversation;
    } catch (error: any) {
      console.error('Error finding existing conversation:', error);
      return null;
    }
  }
}));
