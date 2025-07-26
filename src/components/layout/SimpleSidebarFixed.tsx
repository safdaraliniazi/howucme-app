'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleSidebar({ isOpen, onClose }: SidebarProps) {
  const { appUser, signOut } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  if (!appUser) return null;

  const menuItems = [
    { name: 'Feed', href: '/feed', icon: '🏠' },
    { name: 'Discover', href: '/discover', icon: '🔍' },
    { name: 'Communities', href: '/communities', icon: '🏘️' },
    { name: 'Advanced Features', href: '/advanced-features', icon: '⚡' },
    { name: 'Relationships', href: '/relationships', icon: '💝' },
    { name: 'Family', href: '/family', icon: '👨‍👩‍👧‍👦' },
    { name: 'Achievements', href: '/achievements', icon: '🏆' },
    { name: 'Profile', href: '/profile', icon: '👤' }
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Howucme
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {appUser.profilePicUrl ? (
              <img
                src={appUser.profilePicUrl}
                alt={appUser.name}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-medium">
                  {appUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{appUser.name}</h3>
              <p className="text-sm text-gray-500">{appUser.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center space-x-4 px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors ${
                pathname === item.href ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
