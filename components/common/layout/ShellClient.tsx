'use client';

import { useState } from 'react';

import Header from '@/components/common/header/Header';
import Particles from '@/components/common/Particles';
import type { MenuItem } from '@/components/common/sidebar/Menu';
import Sidebar from '@/components/common/sidebar/Sidebar';
import type { User } from '@/types/user';

type Props = {
  children: React.ReactNode;
  user: User;
  menu: MenuItem[];
};

export default function ShellClient({ children, user, menu }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className='h-screen timeport-main-background flex relative overflow-hidden'>
      {/* 浮遊パーティクル（クライアントで描画 → 水和ズレ回避） */}
      <div className='absolute inset-0 pointer-events-none'>
        <Particles />
      </div>

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} user={user} menu={menu} />

      <div className='flex-1 flex flex-col relative z-10 h-full w-full lg:w-auto main-container'>
        <Header user={user} setIsOpen={setIsOpen} />
        <main className='flex-1 overflow-y-auto custom-scrollbar h-full w-full mobile-main'>
          <div className='w-full mx-auto animate-slide-in'>{children}</div>
        </main>
      </div>
    </div>
  );
}
