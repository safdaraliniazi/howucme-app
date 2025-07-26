'use client';

import { useState } from 'react';
import { usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';

export default function CreatePost() {
  const [text, setText] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState('');

  const { createPost, loading } = usePostStore();
  const { appUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('Please add some text to your post');
      return;
    }

    try {
      setError(''); // Clear any previous errors
      await createPost(text, undefined, anonymous); // Text-only posts
      
      // Reset form
      setText('');
      setAnonymous(false);
    } catch (error: any) {
      console.error('Error creating post:', error);
      setError(error.message || 'Failed to create post. Please try again.');
    }
  };

  if (!appUser) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-gray-500">Please sign in to create posts</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start space-x-4">
          <img
            src={appUser.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(appUser.name)}&background=6366f1&color=white`}
            alt={appUser.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          
          <div className="flex-1">
            <form onSubmit={handleSubmit}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Share something kind today..."
                className="w-full p-4 text-gray-900 border-2 border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                rows={3}
                maxLength={500}
              />
              
              {/* Error Display */}
              {error && (
                <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-4">
                  {/* Anonymous Toggle */}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Post anonymously</span>
                  </label>
                </div>
                
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!text.trim() || loading}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Sharing...' : 'Share'}
                </button>
              </div>
              
              {/* Character Count */}
              <div className="mt-2 text-right">
                <span className={`text-sm ${text.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
                  {text.length}/500
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
