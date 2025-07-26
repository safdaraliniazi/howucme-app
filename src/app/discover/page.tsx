'use client';

import { useAuthStore } from '@/store/authStore';
import { useDiscoveryStore } from '@/store/discoveryStore';
import { useCommunityStore } from '@/store/communityStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';

export default function DiscoverPage() {
  const { user, appUser, loading: authLoading } = useAuthStore();
  const {
    discoveredCommunities,
    discoveredFamilies,
    recommendations,
    userPreferences,
    loading,
    error,
    fetchDiscoveredContent,
    searchCommunities,
    searchFamilies,
    fetchUserPreferences,
    generateRecommendations
  } = useDiscoveryStore();
  
  const { joinCommunity } = useCommunityStore();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'communities' | 'families' | 'all'>('all');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'recommendations' | 'search'>('discover');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (appUser) {
      fetchDiscoveredContent();
      fetchUserPreferences();
      generateRecommendations();
    }
  }, [appUser]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      if (searchType === 'communities') {
        const results = await searchCommunities(searchQuery);
        setSearchResults(results);
      } else if (searchType === 'families') {
        const results = await searchFamilies(searchQuery);
        setSearchResults(results);
      } else {
        const [communityResults, familyResults] = await Promise.all([
          searchCommunities(searchQuery),
          searchFamilies(searchQuery)
        ]);
        setSearchResults([...communityResults, ...familyResults]);
      }
      setActiveTab('search');
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    try {
      await joinCommunity(communityId);
      // Refresh discovered content
      await fetchDiscoveredContent();
    } catch (error) {
      console.error('Error joining community:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading discovery...</p>
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">🔍 Discover Communities</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find your people! Explore communities, families, and connections that align with your values and interests.
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for communities, families, or topics..."
                  className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as any)}
                  className="p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="communities">Communities</option>
                  <option value="families">Families</option>
                </select>
                
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-md mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-8">
                {[
                  { id: 'discover', name: 'Discover', icon: '🌟', description: 'Trending communities and families' },
                  { id: 'recommendations', name: 'For You', icon: '🎯', description: 'Personalized recommendations' },
                  { id: 'search', name: 'Search Results', icon: '🔍', description: `${searchResults.length} results` }
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
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{tab.description}</div>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              {/* Discover Tab */}
              {activeTab === 'discover' && (
                <div className="space-y-8">
                  {/* Featured Communities */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">🔥 Trending Communities</h2>
                    {discoveredCommunities.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {discoveredCommunities.slice(0, 6).map((community) => (
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
                                Join Community
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">🌟</div>
                        <h3 className="text-lg font-medium mb-2">No communities found</h3>
                        <p>Be the first to create a community!</p>
                      </div>
                    )}
                  </div>

                  {/* Featured Families */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">👨‍👩‍👧‍👦 Open Families</h2>
                    {discoveredFamilies.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {discoveredFamilies.slice(0, 6).map((family) => (
                          <div key={family.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">{family.name}</h3>
                                {family.motto && (
                                  <p className="text-sm text-gray-600 italic">"{family.motto}"</p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-500">👥 {family.memberCount}</div>
                              </div>
                            </div>

                            {family.description && (
                              <p className="text-gray-700 text-sm mb-4 line-clamp-3">{family.description}</p>
                            )}

                            {family.values.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {family.values.slice(0, 3).map((value, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs"
                                  >
                                    {value}
                                  </span>
                                ))}
                                {family.values.length > 3 && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs">
                                    +{family.values.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex justify-between items-center">
                              <div className="text-xs text-gray-500">
                                Created {family.createdAt.toLocaleDateString()}
                              </div>
                              <button
                                onClick={() => router.push(`/family/${family.id}`)}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium"
                              >
                                View Family
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
                        <h3 className="text-lg font-medium mb-2">No open families found</h3>
                        <p>Start by creating your own chosen family!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recommendations Tab */}
              {activeTab === 'recommendations' && (
                <div className="space-y-8">
                  {userPreferences ? (
                    <>
                      {/* Community Recommendations */}
                      {recommendations.communities.length > 0 && (
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 Recommended Communities</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendations.communities.map((community) => (
                              <div key={community.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center space-x-3 mb-4">
                                  <div className={`w-12 h-12 ${community.category.color} rounded-lg flex items-center justify-center text-2xl`}>
                                    {community.category.icon}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-gray-900">{community.name}</h3>
                                    <p className="text-sm text-gray-500">{community.category.name}</p>
                                  </div>
                                </div>

                                <p className="text-gray-700 text-sm mb-4">{community.description}</p>

                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">👥 {community.memberCount} members</span>
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
                        </div>
                      )}

                      {recommendations.communities.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <div className="text-6xl mb-4">🎯</div>
                          <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
                          <p>Tell us more about your interests to get personalized recommendations!</p>
                          <button
                            onClick={() => router.push('/settings/preferences')}
                            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                          >
                            Set Preferences
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">⚙️</div>
                      <h3 className="text-lg font-medium mb-2">Set up your preferences</h3>
                      <p>Tell us about your interests to get personalized recommendations!</p>
                      <button
                        onClick={() => router.push('/settings/preferences')}
                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Get Started
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Search Results Tab */}
              {activeTab === 'search' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    🔍 Search Results ({searchResults.length})
                  </h2>
                  
                  {searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {searchResults.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                          {'category' in item ? (
                            // Community card
                            <>
                              <div className="flex items-center space-x-3 mb-4">
                                <div className={`w-12 h-12 ${item.category.color} rounded-lg flex items-center justify-center text-2xl`}>
                                  {item.category.icon}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                  <p className="text-sm text-gray-500">Community • {item.category.name}</p>
                                </div>
                              </div>
                              <p className="text-gray-700 text-sm mb-4">{item.description}</p>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">👥 {item.memberCount} members</span>
                                <button
                                  onClick={() => handleJoinCommunity(item.id)}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                                >
                                  Join
                                </button>
                              </div>
                            </>
                          ) : (
                            // Family card
                            <>
                              <div className="mb-4">
                                <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                                <p className="text-sm text-gray-500">Family</p>
                                {item.motto && (
                                  <p className="text-sm text-gray-600 italic mt-1">"{item.motto}"</p>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-gray-700 text-sm mb-4">{item.description}</p>
                              )}
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">👥 {item.memberCount} members</span>
                                <button
                                  onClick={() => router.push(`/family/${item.id}`)}
                                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium"
                                >
                                  View
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">🔍</div>
                      <h3 className="text-lg font-medium mb-2">No results found</h3>
                      <p>Try different keywords or explore our trending communities!</p>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">🔍</div>
                      <h3 className="text-lg font-medium mb-2">Search for communities and families</h3>
                      <p>Use the search bar above to find communities and families that match your interests!</p>
                    </div>
                  )}
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
