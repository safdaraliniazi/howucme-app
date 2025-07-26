'use client';

import { useAuthStore } from '@/store/authStore';
import { useCommunityStore } from '@/store/communityStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';

export default function CommunitiesPage() {
  const { user, appUser, loading: authLoading } = useAuthStore();
  const {
    communities,
    userCommunities,
    categories,
    loading,
    error,
    fetchCommunities,
    fetchUserCommunities,
    createCommunity,
    joinCommunity
  } = useCommunityStore();
  
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'my-communities' | 'all-communities' | 'create'>('my-communities');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    category: categories[0],
    tags: [''],
    isPublic: true,
    maxMembers: undefined as number | undefined,
    rules: [''],
    welcomeMessage: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (appUser) {
      fetchUserCommunities();
      fetchCommunities();
    }
  }, [appUser]);

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const filters = categoryId ? { category: categoryId } : undefined;
    fetchCommunities(filters);
  };

  const handleCreateCommunity = async () => {
    try {
      const filteredTags = newCommunity.tags.filter(tag => tag.trim() !== '');
      const filteredRules = newCommunity.rules.filter(rule => rule.trim() !== '');
      
      const communityData: any = {
        name: newCommunity.name,
        description: newCommunity.description,
        category: newCommunity.category,
        tags: filteredTags,
        isPublic: newCommunity.isPublic,
        rules: filteredRules,
        welcomeMessage: newCommunity.welcomeMessage
      };

      // Only add optional fields if they have values
      if (newCommunity.maxMembers) {
        communityData.maxMembers = newCommunity.maxMembers;
      }

      const communityId = await createCommunity(communityData);
      
      // Reset form
      setNewCommunity({
        name: '',
        description: '',
        category: categories[0],
        tags: [''],
        isPublic: true,
        maxMembers: undefined,
        rules: [''],
        welcomeMessage: ''
      });
      
      setShowCreateForm(false);
      setActiveTab('my-communities');
      
      // Navigate to the new community
      router.push(`/communities/${communityId}`);
    } catch (error) {
      console.error('Error creating community:', error);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    try {
      await joinCommunity(communityId);
      await fetchUserCommunities();
    } catch (error) {
      console.error('Error joining community:', error);
    }
  };

  const handleTagChange = (index: number, value: string) => {
    const newTags = [...newCommunity.tags];
    newTags[index] = value;
    setNewCommunity({ ...newCommunity, tags: newTags });
  };

  const addTag = () => {
    setNewCommunity({ ...newCommunity, tags: [...newCommunity.tags, ''] });
  };

  const removeTag = (index: number) => {
    const newTags = newCommunity.tags.filter((_, i) => i !== index);
    setNewCommunity({ ...newCommunity, tags: newTags });
  };

  const handleRuleChange = (index: number, value: string) => {
    const newRules = [...newCommunity.rules];
    newRules[index] = value;
    setNewCommunity({ ...newCommunity, rules: newRules });
  };

  const addRule = () => {
    setNewCommunity({ ...newCommunity, rules: [...newCommunity.rules, ''] });
  };

  const removeRule = (index: number) => {
    const newRules = newCommunity.rules.filter((_, i) => i !== index);
    setNewCommunity({ ...newCommunity, rules: newRules });
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading communities...</p>
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">🏘️ Communities</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join communities of people who share your interests, values, and passions. Create your own community and build meaningful connections.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{userCommunities.length}</p>
                  <p className="text-gray-600">My Communities</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🌟</span>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{communities.length}</p>
                  <p className="text-gray-600">Available Communities</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                  <p className="text-gray-600">Categories</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-md mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-8">
                {[
                  { id: 'my-communities', name: 'My Communities', icon: '👤', count: userCommunities.length },
                  { id: 'all-communities', name: 'All Communities', icon: '🌍', count: communities.length },
                  { id: 'create', name: 'Create Community', icon: '➕', count: null }
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
              {/* My Communities Tab */}
              {activeTab === 'my-communities' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Your Communities</h2>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                    >
                      ➕ Create New Community
                    </button>
                  </div>

                  {userCommunities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userCommunities.map((community) => (
                        <div key={community.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className={`w-12 h-12 ${community.category.color} rounded-lg flex items-center justify-center text-2xl`}>
                              {community.category.icon}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{community.name}</h3>
                              <p className="text-sm text-gray-500">{community.category.name}</p>
                            </div>
                          </div>

                          <p className="text-gray-700 text-sm mb-4 line-clamp-3">{community.description}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>👥 {community.memberCount}</span>
                              <span>🕒 {community.lastActivity.toLocaleDateString()}</span>
                            </div>
                            <button
                              onClick={() => router.push(`/communities/${community.id}`)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">👥</div>
                      <h3 className="text-lg font-medium mb-2">No communities yet</h3>
                      <p className="mb-4">Join existing communities or create your own to get started!</p>
                      <div className="space-x-4">
                        <button
                          onClick={() => setActiveTab('all-communities')}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                        >
                          Explore Communities
                        </button>
                        <button
                          onClick={() => setActiveTab('create')}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                        >
                          Create Community
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* All Communities Tab */}
              {activeTab === 'all-communities' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">All Communities</h2>
                    
                    {/* Category Filter */}
                    <div className="flex items-center space-x-4">
                      <select
                        value={selectedCategory}
                        onChange={(e) => handleCategoryFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Categories</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <button
                      onClick={() => handleCategoryFilter('')}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        selectedCategory === ''
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryFilter(category.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          selectedCategory === category.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span className="mr-1">{category.icon}</span>
                        {category.name}
                      </button>
                    ))}
                  </div>

                  {communities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {communities.map((community) => (
                        <div key={community.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-12 h-12 ${community.category.color} rounded-lg flex items-center justify-center text-2xl`}>
                                {community.category.icon}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{community.name}</h3>
                                <p className="text-sm text-gray-500">{community.category.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">👥 {community.memberCount}</div>
                              {community.maxMembers && (
                                <div className="text-xs text-gray-400">max {community.maxMembers}</div>
                              )}
                            </div>
                          </div>

                          <p className="text-gray-700 text-sm mb-4 line-clamp-3">{community.description}</p>

                          {community.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {community.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                              {community.tags.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  +{community.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-500">
                              Active {community.lastActivity.toLocaleDateString()}
                            </div>
                            <button
                              onClick={() => handleJoinCommunity(community.id)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                            >
                              Join
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">🌍</div>
                      <h3 className="text-lg font-medium mb-2">No communities found</h3>
                      <p>Try adjusting your filters or create the first community in this category!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Create Community Tab */}
              {activeTab === 'create' && (
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Community</h2>
                  
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Community Name *
                      </label>
                      <input
                        type="text"
                        value={newCommunity.name}
                        onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                        placeholder="e.g., Local Gardening Enthusiasts"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={newCommunity.description}
                        onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                        placeholder="Describe your community's purpose, goals, and what members can expect..."
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={newCommunity.category.id}
                        onChange={(e) => {
                          const category = categories.find(c => c.id === e.target.value) || categories[0];
                          setNewCommunity({ ...newCommunity, category });
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-gray-500 mt-1">{newCommunity.category.description}</p>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                      </label>
                      <p className="text-sm text-gray-500 mb-3">
                        Add tags to help people discover your community
                      </p>
                      {newCommunity.tags.map((tag, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={tag}
                            onChange={(e) => handleTagChange(index, e.target.value)}
                            placeholder="e.g., gardening, sustainability, beginners-friendly"
                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {newCommunity.tags.length > 1 && (
                            <button
                              onClick={() => removeTag(index)}
                              className="text-red-500 hover:text-red-700 p-2"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      {newCommunity.tags.length < 10 && (
                        <button
                          onClick={addTag}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          + Add Another Tag
                        </button>
                      )}
                    </div>

                    {/* Settings */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Community Settings
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="visibility"
                            checked={newCommunity.isPublic}
                            onChange={() => setNewCommunity({ ...newCommunity, isPublic: true })}
                            className="text-blue-600"
                          />
                          <div>
                            <div className="font-medium text-gray-900">Public Community</div>
                            <div className="text-sm text-gray-500">Anyone can discover and join</div>
                          </div>
                        </label>
                        <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="visibility"
                            checked={!newCommunity.isPublic}
                            onChange={() => setNewCommunity({ ...newCommunity, isPublic: false })}
                            className="text-blue-600"
                          />
                          <div>
                            <div className="font-medium text-gray-900">Private Community</div>
                            <div className="text-sm text-gray-500">Invitation only</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Max Members */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Members (Optional)
                      </label>
                      <input
                        type="number"
                        value={newCommunity.maxMembers || ''}
                        onChange={(e) => setNewCommunity({ 
                          ...newCommunity, 
                          maxMembers: e.target.value ? parseInt(e.target.value) : undefined 
                        })}
                        placeholder="Leave empty for no limit"
                        min="2"
                        max="10000"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Community Rules */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Community Rules
                      </label>
                      <p className="text-sm text-gray-500 mb-3">
                        Set clear guidelines for your community
                      </p>
                      {newCommunity.rules.map((rule, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={rule}
                            onChange={(e) => handleRuleChange(index, e.target.value)}
                            placeholder={`Rule ${index + 1}: e.g., Be respectful to all members`}
                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {newCommunity.rules.length > 1 && (
                            <button
                              onClick={() => removeRule(index)}
                              className="text-red-500 hover:text-red-700 p-2"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      {newCommunity.rules.length < 10 && (
                        <button
                          onClick={addRule}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          + Add Another Rule
                        </button>
                      )}
                    </div>

                    {/* Welcome Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Welcome Message (Optional)
                      </label>
                      <textarea
                        value={newCommunity.welcomeMessage}
                        onChange={(e) => setNewCommunity({ ...newCommunity, welcomeMessage: e.target.value })}
                        placeholder="A warm welcome message for new members..."
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Error Display */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">{error}</p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex space-x-4">
                      <button
                        onClick={handleCreateCommunity}
                        disabled={loading || !newCommunity.name.trim() || !newCommunity.description.trim()}
                        className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {loading ? 'Creating Community...' : 'Create Community'}
                      </button>
                      <button
                        onClick={() => setActiveTab('my-communities')}
                        className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && activeTab !== 'create' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
