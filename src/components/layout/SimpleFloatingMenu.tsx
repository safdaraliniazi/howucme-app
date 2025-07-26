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
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
        {/* Menu items */}
        {isOpen && (
          <div style={{ 
            position: 'absolute', 
            bottom: '70px', 
            right: '0px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  router.push(item.href);
                  setIsOpen(false);
                }}
                className={`${item.bg} text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all`}
                title={item.name}
                style={{ fontSize: '18px', minWidth: '48px', minHeight: '48px' }}
              >
                {item.icon}
              </button>
            ))}
          </div>
        )}

        {/* Main button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:scale-110 transition-all"
          style={{
            width: '56px',
            height: '56px',
            fontSize: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            zIndex: 9998
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
