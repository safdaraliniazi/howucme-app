'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function FloatingMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { appUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  console.log('FloatingMenu rendered, appUser:', appUser ? 'exists' : 'null');

  if (!appUser) {
    console.log('FloatingMenu: No appUser, not rendering');
    return null;
  }

  const menuItems = [
    { name: 'Feed', href: '/feed', icon: '🏠', color: 'bg-blue-500' },
    { name: 'Profile', href: '/profile', icon: '👤', color: 'bg-green-500' },
    { name: 'Relationships', href: '/relationships', icon: '💝', color: 'bg-purple-500' },
    { name: 'Family', href: '/family', icon: '👨‍👩‍👧‍👦', color: 'bg-pink-500' },
  ];

  console.log('FloatingMenu: Rendering with appUser');

  return (
    <>
      {/* Debug button */}
      <div className="fixed bottom-20 left-6 z-[80] bg-red-500 text-white p-2 rounded text-xs">
        FloatingMenu Active
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-[60]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Menu Button */}
      <div className="fixed bottom-6 right-6 z-[70]">
        {/* Menu Items */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col space-y-3 mb-4">
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  router.push(item.href);
                  setIsOpen(false);
                }}
                className={`${item.color} text-white p-3 rounded-full shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center group relative`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="absolute right-14 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Main Toggle Button - Make it more visible */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 border-2 border-white ${
            isOpen ? 'rotate-45' : 'rotate-0'
          }`}
          style={{ 
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
          }}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
    </>
  );
}
