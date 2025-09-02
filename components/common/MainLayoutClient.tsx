'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';

import Header from '@/components/common/Header';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Particles from '@/components/common/Particles';
import Sidebar from '@/components/common/Sidebar/Sidebar';

type Props = {
  children: React.ReactNode;
  initialSidebarOpen?: boolean;
  particlesCount: number;
};

export default function MainLayoutClient({ children, initialSidebarOpen = false }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(initialSidebarOpen);
  const pathname = usePathname();

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const user = {};

  // ログインページ、feature-disabledページ、エラーページ、404ページの場合はレイアウトを適用しない
  if (
    pathname === '/login' ||
    pathname === '/member/feature-disabled' ||
    pathname === '/error' ||
    pathname === '/not-found'
  ) {
    return <>{children}</>;
  }

  if (!user) {
    if (pathname !== '/login') {
      return (
        <div className="min-h-screen flex items-center justify-center timeport-main-background">
          <LoadingSpinner message="リダイレクト中..." />
        </div>
      );
    }
    return <>{children}</>;
  }

  return (
    <div className="h-screen timeport-main-background flex relative overflow-hidden">
      {/* 浮遊パーティクル（クライアントで描画 → 水和ズレ回避） */}
      <div className="absolute inset-0 pointer-events-none">
        <Particles />
      </div>

      {/* ここで Sidebar を使うなら： */}
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <div className="flex-1 flex flex-col relative z-10 h-full w-full lg:w-auto main-container">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-y-auto custom-scrollbar h-full w-full mobile-main">
          <div className="w-full mx-auto animate-slide-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
