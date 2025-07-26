'use client';

import { useState } from 'react';
import { usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { Post } from '@/types';

interface PostCardProps {
  post: Post;
  author?: { name: string; profilePicUrl?: string };
}

export default function PostCard({ post, author }: PostCardProps) {
  const { reactToPost, deletePost } = usePostStore();
  const { appUser } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleReaction = async (reactionType: string) => {
    try {
      await reactToPost(post.id, reactionType);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const reactions = [
    { type: 'heart', emoji: '❤️', label: 'Heart' },
    { type: 'sparkles', emoji: '✨', label: 'Sparkles' },
    { type: 'clap', emoji: '👏', label: 'Clap' },
    { type: 'star', emoji: '⭐', label: 'Star' },
  ];

  // Check if current user can delete this post
  const canDelete = appUser && (appUser.uid === post.fromUid);

  // Author info
  const authorName = post.anonymous ? 'Anonymous' : (author?.name || 'Unknown User');
  const authorAvatar = post.anonymous ? 
    'https://ui-avatars.com/api/?name=A&background=gray&color=white' : 
    (author?.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=6366f1&color=white`);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img
            src={authorAvatar}
            alt={authorName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-medium text-gray-900">{authorName}</h3>
            <p className="text-sm text-gray-500">{formatTimeAgo(post.createdAt)}</p>
          </div>
        </div>
        
        {canDelete && (
          <div className="relative">
            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {showDeleteConfirm && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                <p className="text-sm text-gray-600 mb-2">Delete this post?</p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-800 whitespace-pre-wrap break-words">{post.text}</p>
        
        {post.mediaUrl && (
          <div className="mt-3">
            {post.mediaType === 'video' ? (
              <video
                src={post.mediaUrl}
                className="w-full max-h-96 object-contain rounded-lg"
                controls
                preload="metadata"
              />
            ) : (
              <img
                src={post.mediaUrl}
                alt="Post media"
                className="w-full max-h-96 object-contain rounded-lg cursor-pointer"
                onClick={() => window.open(post.mediaUrl, '_blank')}
              />
            )}
          </div>
        )}
      </div>

      {/* Reactions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          {reactions.map((reaction) => {
            const count = post.reactions[reaction.type] || 0;
            const userReaction = appUser ? post.userReactions?.[appUser.uid] : null;
            const isUserReaction = userReaction === reaction.type;
            
            return (
              <button
                key={reaction.type}
                onClick={() => handleReaction(reaction.type)}
                className={`flex items-center space-x-2 transition-colors group ${
                  isUserReaction 
                    ? 'text-blue-600 bg-blue-50 px-2 py-1 rounded-full' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
                title={reaction.label}
              >
                <span className={`text-lg transition-transform ${
                  isUserReaction ? 'scale-110' : 'group-hover:scale-110'
                }`}>
                  {reaction.emoji}
                </span>
                {count > 0 && (
                  <span className={`text-sm font-medium ${
                    isUserReaction ? 'text-blue-700' : ''
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        <div className="text-sm text-gray-500">
          {Object.values(post.reactions).reduce((sum, count) => sum + count, 0) > 0 && (
            <span>
              {Object.values(post.reactions).reduce((sum, count) => sum + count, 0)} reactions
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
