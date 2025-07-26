'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

interface CommunityPollsProps {
  communityId: string;
}

export default function CommunityPolls({ communityId }: CommunityPollsProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'create'>('active');
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', ''],
    description: '',
    duration: 7,
    allowMultiple: false,
    anonymous: false
  });

  // Mock polls for demonstration
  const mockPolls = [
    {
      id: '1',
      question: 'What time should we hold our weekly community meeting?',
      description: 'Help us choose the best time for maximum participation',
      options: [
        { id: '1', text: '6:00 PM EST', votes: 15 },
        { id: '2', text: '7:00 PM EST', votes: 28 },
        { id: '3', text: '8:00 PM EST', votes: 12 },
        { id: '4', text: '9:00 PM EST', votes: 8 }
      ],
      totalVotes: 63,
      createdBy: 'Community Admin',
      createdAt: new Date(Date.now() - 86400000 * 2),
      endsAt: new Date(Date.now() + 86400000 * 5),
      status: 'active',
      userVoted: true,
      userVotes: ['2'],
      allowMultiple: false,
      anonymous: false
    },
    {
      id: '2',
      question: 'Which topics would you like to see in our next workshop series?',
      description: 'Select all that interest you - we\'ll plan based on popular choices',
      options: [
        { id: '1', text: 'Web Development', votes: 22 },
        { id: '2', text: 'Data Science', votes: 18 },
        { id: '3', text: 'Mobile Apps', votes: 14 },
        { id: '4', text: 'AI & Machine Learning', votes: 26 },
        { id: '5', text: 'DevOps & Cloud', votes: 16 }
      ],
      totalVotes: 96,
      createdBy: 'Sarah Johnson',
      createdAt: new Date(Date.now() - 86400000 * 5),
      endsAt: new Date(Date.now() + 86400000 * 2),
      status: 'active',
      userVoted: false,
      userVotes: [],
      allowMultiple: true,
      anonymous: false
    },
    {
      id: '3',
      question: 'How satisfied are you with the current community guidelines?',
      description: 'Your feedback helps us improve our community standards',
      options: [
        { id: '1', text: 'Very Satisfied', votes: 45 },
        { id: '2', text: 'Satisfied', votes: 32 },
        { id: '3', text: 'Neutral', votes: 12 },
        { id: '4', text: 'Needs Improvement', votes: 8 },
        { id: '5', text: 'Major Changes Needed', votes: 3 }
      ],
      totalVotes: 100,
      createdBy: 'Mike Chen',
      createdAt: new Date(Date.now() - 86400000 * 10),
      endsAt: new Date(Date.now() - 86400000 * 1),
      status: 'completed',
      userVoted: true,
      userVotes: ['1'],
      allowMultiple: false,
      anonymous: true
    }
  ];

  const [polls] = useState(mockPolls);
  const [selectedOptions, setSelectedOptions] = useState<{[pollId: string]: string[]}>({});

  const activePollsCount = polls.filter(p => p.status === 'active').length;
  const completedPollsCount = polls.filter(p => p.status === 'completed').length;

  const filteredPolls = polls.filter(poll => {
    switch (activeTab) {
      case 'active':
        return poll.status === 'active';
      case 'completed':
        return poll.status === 'completed';
      default:
        return true;
    }
  });

  const handleVote = (pollId: string, optionId: string) => {
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;

    setSelectedOptions(prev => {
      const currentSelection = prev[pollId] || [];
      
      if (poll.allowMultiple) {
        // Toggle option for multiple choice
        if (currentSelection.includes(optionId)) {
          return {
            ...prev,
            [pollId]: currentSelection.filter(id => id !== optionId)
          };
        } else {
          return {
            ...prev,
            [pollId]: [...currentSelection, optionId]
          };
        }
      } else {
        // Single choice - replace selection
        return {
          ...prev,
          [pollId]: [optionId]
        };
      }
    });
  };

  const submitVote = (pollId: string) => {
    const selection = selectedOptions[pollId];
    if (!selection || selection.length === 0) return;
    
    console.log(`Voting on poll ${pollId} with options:`, selection);
    // Here you would submit to your poll store
    
    // Clear selection after voting
    setSelectedOptions(prev => ({
      ...prev,
      [pollId]: []
    }));
  };

  const addPollOption = () => {
    setNewPoll(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const updatePollOption = (index: number, value: string) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const removePollOption = (index: number) => {
    if (newPoll.options.length > 2) {
      setNewPoll(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const createPoll = () => {
    if (!newPoll.question.trim() || newPoll.options.some(opt => !opt.trim())) {
      return;
    }
    
    console.log('Creating poll:', newPoll);
    // Here you would submit to your poll store
    
    // Reset form
    setNewPoll({
      question: '',
      options: ['', ''],
      description: '',
      duration: 7,
      allowMultiple: false,
      anonymous: false
    });
    setActiveTab('active');
  };

  const getTimeRemaining = (endsAt: Date) => {
    const now = new Date();
    const diff = endsAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Less than 1h remaining';
  };

  const getVotePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const TabButton = ({ 
    id, 
    label, 
    count,
    isActive, 
    onClick 
  }: { 
    id: string; 
    label: string; 
    count?: number;
    isActive: boolean; 
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-purple-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-2 py-1 text-xs rounded-full ${
          isActive ? 'bg-purple-500 text-white' : 'bg-gray-300 text-gray-700'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Community Polls</h2>
            <p className="text-gray-600">Participate in community decisions</p>
          </div>
          <button
            onClick={() => setActiveTab('create')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Create Poll
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mt-6">
          <TabButton
            id="active"
            label="Active Polls"
            count={activePollsCount}
            isActive={activeTab === 'active'}
            onClick={() => setActiveTab('active')}
          />
          <TabButton
            id="completed"
            label="Completed"
            count={completedPollsCount}
            isActive={activeTab === 'completed'}
            onClick={() => setActiveTab('completed')}
          />
          <TabButton
            id="create"
            label="Create Poll"
            isActive={activeTab === 'create'}
            onClick={() => setActiveTab('create')}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'create' ? (
          /* Create Poll Form */
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Create New Poll</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Question *
              </label>
              <input
                type="text"
                value={newPoll.question}
                onChange={(e) => setNewPoll(prev => ({ ...prev, question: e.target.value }))}
                placeholder="What would you like to ask the community?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={newPoll.description}
                onChange={(e) => setNewPoll(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide additional context for your poll..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Options *
              </label>
              <div className="space-y-2">
                {newPoll.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updatePollOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {newPoll.options.length > 2 && (
                      <button
                        onClick={() => removePollOption(index)}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addPollOption}
                  className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors"
                >
                  + Add Option
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poll Duration
                </label>
                <select
                  value={newPoll.duration}
                  onChange={(e) => setNewPoll(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={1}>1 Day</option>
                  <option value={3}>3 Days</option>
                  <option value={7}>1 Week</option>
                  <option value={14}>2 Weeks</option>
                  <option value={30}>1 Month</option>
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowMultiple"
                    checked={newPoll.allowMultiple}
                    onChange={(e) => setNewPoll(prev => ({ ...prev, allowMultiple: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="allowMultiple" className="ml-2 text-sm text-gray-700">
                    Allow multiple selections
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={newPoll.anonymous}
                    onChange={(e) => setNewPoll(prev => ({ ...prev, anonymous: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
                    Anonymous voting
                  </label>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={createPoll}
                disabled={!newPoll.question.trim() || newPoll.options.some(opt => !opt.trim())}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Create Poll
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Poll List */
          <div className="space-y-6">
            {filteredPolls.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">No polls found</h3>
                <p className="text-gray-600">
                  {activeTab === 'active' 
                    ? 'No active polls at the moment. Check back later!'
                    : 'No completed polls to show.'
                  }
                </p>
              </div>
            ) : (
              filteredPolls.map((poll) => (
                <div key={poll.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{poll.question}</h3>
                      {poll.description && (
                        <p className="text-gray-600 text-sm mb-4">{poll.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>By {poll.createdBy}</span>
                        <span>•</span>
                        <span>{poll.totalVotes} votes</span>
                        <span>•</span>
                        <span>{getTimeRemaining(poll.endsAt)}</span>
                        {poll.allowMultiple && (
                          <>
                            <span>•</span>
                            <span className="text-purple-600">Multiple choice</span>
                          </>
                        )}
                        {poll.anonymous && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">Anonymous</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {poll.options.map((option) => {
                      const percentage = getVotePercentage(option.votes, poll.totalVotes);
                      const isSelected = selectedOptions[poll.id]?.includes(option.id);
                      const userVotedForThis = poll.userVotes.includes(option.id);
                      
                      return (
                        <div key={option.id} className="relative">
                          <div
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                              poll.userVoted || poll.status === 'completed'
                                ? userVotedForThis
                                  ? 'border-purple-300 bg-purple-50'
                                  : 'border-gray-200 bg-gray-50'
                                : isSelected
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                            }`}
                            onClick={() => {
                              if (!poll.userVoted && poll.status === 'active') {
                                handleVote(poll.id, option.id);
                              }
                            }}
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <div className={`w-4 h-4 rounded border-2 ${
                                poll.allowMultiple ? 'rounded' : 'rounded-full'
                              } ${
                                isSelected || userVotedForThis
                                  ? 'border-purple-500 bg-purple-500'
                                  : 'border-gray-300'
                              }`}>
                                {(isSelected || userVotedForThis) && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-gray-900">{option.text}</span>
                            </div>
                            
                            {(poll.userVoted || poll.status === 'completed') && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">{option.votes}</span>
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-purple-500 transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-600 w-8">{percentage}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!poll.userVoted && poll.status === 'active' && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => submitVote(poll.id)}
                        disabled={!selectedOptions[poll.id] || selectedOptions[poll.id].length === 0}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Submit Vote
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
