'use client';

import { useState } from 'react';
import { FamilyMember, FamilyRole } from '@/types';
import { useFamilyStore } from '@/store/familyStore';

interface FamilyMemberCardProps {
  member: FamilyMember;
  currentUserId: string;
  canManageRoles?: boolean;
}

export default function FamilyMemberCard({ member, currentUserId, canManageRoles = false }: FamilyMemberCardProps) {
  const { updateMemberRole, removeMember, availableRoles, loading } = useFamilyStore();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<FamilyRole>(member.role);
  const [customTitle, setCustomTitle] = useState(member.customTitle || '');

  const handleSaveRole = async () => {
    try {
      await updateMemberRole(
        member.id, 
        selectedRole, 
        selectedRole.type === 'custom' ? customTitle : undefined
      );
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleRemoveMember = async () => {
    if (window.confirm(`Are you sure you want to remove ${member.userName} from the family?`)) {
      try {
        await removeMember(member.id);
      } catch (error) {
        console.error('Error removing member:', error);
      }
    }
  };

  const isCurrentUser = member.userId === currentUserId;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-semibold">
              {member.userName.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Member Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">{member.userName}</h3>
              {isCurrentUser && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  You
                </span>
              )}
            </div>
            
            <p className="text-gray-600 text-sm">{member.userEmail}</p>
            
            {/* Role Display/Edit */}
            {isEditing ? (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={selectedRole.id}
                    onChange={(e) => {
                      const role = availableRoles.find(r => r.id === e.target.value);
                      if (role) setSelectedRole(role);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.icon} {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRole.type === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Title
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g., Chosen Dad, Soul Sister, Wise Mentor"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveRole}
                    disabled={loading}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedRole(member.role);
                      setCustomTitle(member.customTitle || '');
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-2xl">{member.role.icon}</span>
                <div>
                  <span className="font-medium text-gray-800">
                    {member.customTitle || member.role.name}
                  </span>
                  {member.customTitle && (
                    <span className="text-gray-500 text-sm ml-1">
                      ({member.role.name})
                    </span>
                  )}
                  <p className="text-gray-500 text-xs">{member.role.description}</p>
                </div>
              </div>
            )}

            {/* Member Since */}
            <p className="text-gray-400 text-xs mt-2">
              Member since {member.joinedAt.toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        {canManageRoles && !isCurrentUser && (
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {isEditing ? 'Cancel' : 'Edit Role'}
            </button>
            <button
              onClick={handleRemoveMember}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Permissions (for debugging/admin view) */}
      {canManageRoles && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <details className="text-sm">
            <summary className="text-gray-600 cursor-pointer hover:text-gray-800">
              Permissions
            </summary>
            <div className="mt-2 space-y-1 text-xs text-gray-500">
              <div>Can invite members: {member.permissions.canInviteMembers ? '✅' : '❌'}</div>
              <div>Can manage roles: {member.permissions.canManageRoles ? '✅' : '❌'}</div>
              <div>Can create events: {member.permissions.canCreateEvents ? '✅' : '❌'}</div>
              <div>Can moderate content: {member.permissions.canModerateContent ? '✅' : '❌'}</div>
              <div>Can manage family: {member.permissions.canManageFamily ? '✅' : '❌'}</div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
