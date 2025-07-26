'use client';

import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import SimpleSidebar from './SimpleSidebar';
import FloatingMessageButton from '../messaging/FloatingMessageButton';
import { useAuthStore } from '@/store/authStore';
import { usePathname } from 'next/navigation';

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export default function Layout({ 
  children, 
  showHeader = true, 
  showFooter = true 
}: LayoutProps) {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Don't show header/footer on auth pages
  const isAuthPage = pathname === '/auth';
  
  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && !isAuthPage && (
        <Header 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen}
        />
      )}
      
      <main className="flex-1">
        {children}
      </main>
      
      {showFooter && !isAuthPage && <Footer />}
      
      {/* Sidebar for authenticated users */}
      {user && !isAuthPage && (
        <SimpleSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      )}
      
      {/* Floating Message Button - Hide on messages page */}
      {user && !isAuthPage && pathname !== '/messages' && (
        <FloatingMessageButton />
      )}
    </div>
  );
}
