'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

interface ModerationDashboardProps {
  communityId: string;
}

export default function ModerationDashboard({ communityId }: ModerationDashboardProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'queue' | 'members' | 'analytics' | 'settings'>('queue');

  // Mock data for demonstration
  const mockReports = [
    {
      id: '1',
      type: 'message',
      content: 'Inappropriate language in community chat',
      reportedBy: 'John Doe',
      reportedAt: new Date(),
      severity: 'medium',
      status: 'pending'
    },
    {
      id: '2',
      type: 'post',
      content: 'Spam content shared multiple times',
      reportedBy: 'Jane Smith',
      reportedAt: new Date(Date.now() - 86400000),
      severity: 'high',
      status: 'pending'
    },
    {
      id: '3',
      type: 'user',
      content: 'Harassment reported against user profile',
      reportedBy: 'Community Team',
      reportedAt: new Date(Date.now() - 172800000),
      severity: 'high',
      status: 'resolved'
    }
  ];

  const mockMembers = [
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'member',
      joinedAt: new Date(Date.now() - 86400000 * 30),
      status: 'active',
      violations: 0
    },
    {
      id: '2',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      role: 'moderator',
      joinedAt: new Date(Date.now() - 86400000 * 60),
      status: 'active',
      violations: 1
    },
    {
      id: '3',
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      role: 'member',
      joinedAt: new Date(Date.now() - 86400000 * 15),
      status: 'suspended',
      violations: 3
    }
  ];

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
          ? 'bg-red-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-2 py-1 text-xs rounded-full ${
          isActive ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-700'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'dismissed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Moderation Dashboard</h2>
            <p className="text-gray-600">Manage community content and members</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              Community Healthy
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mt-6">
          <TabButton
            id="queue"
            label="Content Queue"
            count={mockReports.filter(r => r.status === 'pending').length}
            isActive={activeTab === 'queue'}
            onClick={() => setActiveTab('queue')}
          />
          <TabButton
            id="members"
            label="Member Management"
            count={mockMembers.length}
            isActive={activeTab === 'members'}
            onClick={() => setActiveTab('members')}
          />
          <TabButton
            id="analytics"
            label="Analytics"
            isActive={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          />
          <TabButton
            id="settings"
            label="Auto-Moderation"
            isActive={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Content Queue Tab */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Reported Content</h3>
              <div className="flex space-x-2">
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>All Reports</option>
                  <option>High Priority</option>
                  <option>Pending Only</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {mockReports.map((report) => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {report.type} Report
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(report.severity)}`}>
                          {report.severity.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(report.status)}`}>
                          {report.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{report.content}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>Reported by {report.reportedBy}</span>
                        <span className="mx-2">•</span>
                        <span>{report.reportedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {report.status === 'pending' && (
                      <div className="flex space-x-2 ml-4">
                        <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                          Approve
                        </button>
                        <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                          Remove
                        </button>
                        <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Member Management Tab */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Community Members</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Search members..."
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>All Members</option>
                  <option>Moderators</option>
                  <option>Suspended</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Violations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockMembers.map((member) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          member.role === 'moderator' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          member.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.violations}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            Edit
                          </button>
                          {member.status === 'active' ? (
                            <button className="text-red-600 hover:text-red-900">
                              Suspend
                            </button>
                          ) : (
                            <button className="text-green-600 hover:text-green-900">
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Moderation Analytics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">156</div>
                <div className="text-sm text-blue-800">Total Reports</div>
                <div className="text-xs text-blue-600 mt-1">+12% this month</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">142</div>
                <div className="text-sm text-green-800">Resolved</div>
                <div className="text-xs text-green-600 mt-1">91% resolution rate</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">14</div>
                <div className="text-sm text-yellow-800">Pending</div>
                <div className="text-xs text-yellow-600 mt-1">Avg. 2.3 hours</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">8</div>
                <div className="text-sm text-red-800">Actions Taken</div>
                <div className="text-xs text-red-600 mt-1">5% of reports</div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Recent Activity</h4>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  <span className="text-gray-600">Spam post removed by Auto-Moderation</span>
                  <span className="text-gray-400 ml-auto">2 minutes ago</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  <span className="text-gray-600">User warning issued for inappropriate language</span>
                  <span className="text-gray-400 ml-auto">15 minutes ago</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
                  <span className="text-gray-600">New report submitted for review</span>
                  <span className="text-gray-400 ml-auto">1 hour ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Moderation Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Auto-Moderation Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Spam Detection</h4>
                  <p className="text-sm text-gray-600">Automatically detect and remove spam content</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Profanity Filter</h4>
                  <p className="text-sm text-gray-600">Filter out inappropriate language automatically</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Link Verification</h4>
                  <p className="text-sm text-gray-600">Check links for malicious content before posting</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Rate Limiting</h4>
                  <p className="text-sm text-gray-600">Prevent users from posting too frequently</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-900">Auto-Moderation Tips</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    Enable multiple filters for best protection. Review auto-moderated content regularly 
                    to ensure accuracy and adjust settings as needed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
