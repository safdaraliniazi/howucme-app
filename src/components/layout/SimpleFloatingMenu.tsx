'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function SimpleFloatingMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { appUser } = useAuthStore();
  const router = useRouter();

  if (!appUser) return null;

  const menuItems = [
    { name: 'Profile', href: '/profile', icon: '👤', bg: 'bg-green-500' },
    { name: 'Relationships', href: '/relationships', icon: '💝', bg: 'bg-purple-500' },
    { name: 'Family', href: '/family', icon: '👨‍👩‍👧‍👦', bg: 'bg-pink-500' },
  ];

  return (
    <>
      {/* Simple floating button */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        {/* Menu items */}
        {isOpen && (
          <div className="absolute bottom-[70px] right-0 flex flex-col gap-3">
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  router.push(item.href);
                  setIsOpen(false);
                }}
                className={`${item.bg} text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all text-lg min-w-[48px] min-h-[48px] flex items-center justify-center`}
                title={item.name}
              >
                {item.icon}
              </button>
            ))}
          </div>
        )}

        {/* Main button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:scale-110 transition-all w-14 h-14 text-2xl flex items-center justify-center"
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[9998]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
