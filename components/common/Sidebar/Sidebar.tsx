'use client';

import {
  Activity,
  BarChart3,
  Building,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Home,
  House,
  LogOut,
  MessageSquare,
  Server,
  Settings,
  Shield,
  User as UserIcon,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { redirect, usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { toast } from '@/hooks/use-toast';
import { logoutAction } from '@/lib/actions/auth';
import { cn } from '@/lib/utils/common';
import type { User } from '@/types/user';

type MenuItem =
  | { href: string; icon: keyof typeof iconMap; label: string; feature?: string }
  | { href: ''; icon: keyof typeof iconMap; label: string };

const iconMap = {
  home: Home,
  clock: Clock,
  calendar: Calendar,
  fileText: FileText,
  users: Users,
  settings: Settings,
  barChart3: BarChart3,
  building: Building,
  clipboardList: ClipboardList,
  activity: Activity,
  house: House,
  messageSquare: MessageSquare,
} as const;

interface SidebarProps {
  setIsOpen: (value: boolean) => void;
  isOpen: boolean;
  user: User;
  menu: MenuItem[];
}

export default function Sidebar({ setIsOpen, isOpen = false, user, menu }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const role = user.role;
  const features = user.features;
  const menuItems = menu.filter((item) => {
    if (!('href' in item) || item.href === '') return true;
    if ('features' in item && item.features && typeof item.features === 'string')
      return !!(features as Record<string, boolean>)[item.features];
    return true;
  });

  const sidebarClasses = cn(
    'fixed left-0 top-0 z-50 h-full min-h-screen timeport-sidebar text-white transition-all duration-300 shadow-2xl flex flex-col',
    'lg:relative lg:z-0 lg:translate-x-0',
    isOpen && 'mobile-open',
    isCollapsed ? 'w-16' : 'w-64'
  );

  return (
    <>
      {isOpen && (
        <div
          className='fixed inset-0 bg-black/50 lg:hidden z-40'
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside className={sidebarClasses}>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-white/20'>
          <div className={cn('flex items-center space-x-3', isCollapsed && 'justify-center')}>
            {!isCollapsed && (
              <>
                <div className='w-8 h-8 bg-white rounded-lg flex items-center justify-center'>
                  <span className='text-blue-600 font-bold text-lg'>T</span>
                </div>
                <div>
                  <h1 className='text-lg font-bold'>TimePort</h1>
                  <p className='text-xs text-white/80'>勤怠管理システム</p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className='lg:block hidden p-1 rounded-lg hover:bg-white/10 transition-colors'
          >
            {isCollapsed ? (
              <ChevronRight className='w-5 h-5' />
            ) : (
              <ChevronLeft className='w-5 h-5' />
            )}
          </button>
        </div>

        {/* User Info */}
        <div className='p-4 border-b border-white/20 space-y-4'>
          <div className={cn('flex items-center space-x-3', isCollapsed && 'justify-center')}>
            <div className='w-10 h-10 bg-white/20 rounded-full flex items-center justify-center'>
              <UserIcon className='w-5 h-5' />
            </div>
            {!isCollapsed && (
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium truncate'>{user?.full_name}</p>
                <p className='text-xs text-white/80 truncate'>
                  {role === 'system-admin'
                    ? 'システム管理者'
                    : role === 'admin'
                      ? '管理者'
                      : 'メンバー'}
                </p>
              </div>
            )}
          </div>

          {/* Screen Buttons */}
          <div className='flex flex-col space-y-2 w-full items-center justify-center'>
            {user.role !== 'member' && (
              <button
                onClick={() => {
                  router.push('/member');
                }}
                className={`w-full p-2 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors ${pathname.startsWith('/member') ? 'bg-white/30 border-white/50 border-2' : 'bg-white/10'}`}
                title='メンバー画面'
              >
                <Users className='w-4 h-4 text-white' />
                {!isCollapsed && <span className='ml-3'>メンバー画面</span>}
              </button>
            )}

            {user.role !== 'member' && (
              <button
                onClick={() => {
                  router.push('/admin');
                }}
                className={`w-full p-2 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors ${pathname.startsWith('/admin') ? 'bg-white/30 border-white/50 border-2' : 'bg-white/10'}`}
                title='管理者画面'
              >
                <Server className='w-4 h-4 text-white' />
                {!isCollapsed && <span className='ml-3'>管理者画面</span>}
              </button>
            )}

            {user.role === 'system-admin' && (
              <button
                onClick={() => {
                  router.push('/system-admin');
                }}
                className={`w-full p-2 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors ${pathname.startsWith('/system-admin') ? 'bg-white/30 border-white/50 border-2' : 'bg-white/10'}`}
                title='システム管理者画面'
              >
                <Shield className='w-4 h-4 text-white' />
                {!isCollapsed && <span className='ml-3'>システム管理者画面</span>}
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className='flex-1 p-4 space-y-2 overflow-y-auto'>
          {menuItems.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = pathname === item.href;

            // セパレーターの場合
            if (item.href === '') {
              return (
                <div
                  key={`separator-${item.label}`}
                  className={cn('border-t border-white/20 my-4', isCollapsed && 'mx-2')}
                />
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-white/20 text-white backdrop-blur-sm shadow-lg border-white/50 border-2'
                    : 'text-white/80 hover:bg-white/10 hover:text-white transform hover:scale-[1.02]',
                  isCollapsed && 'justify-center'
                )}
                prefetch={true}
                // モバイルでメニュー項目クリック時の処理は削除
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'animate-pulse')} />
                {!isCollapsed && <span className='ml-3'>{item.label}</span>}
                {!isCollapsed && isActive && (
                  <div className='ml-auto w-2 h-2 bg-white rounded-full animate-pulse' />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className='p-4 border-t border-white/20 mt-auto'>
          <button
            onClick={async () => {
              setIsLoggingOut(true);
              const result = await logoutAction(user.id);
              if (result.ok) {
                redirect('/login');
              }
              toast({
                title: 'エラー',
                description: result.error?.message || 'ログアウトに失敗しました',
                variant: 'destructive',
              });
              redirect('/login');
            }}
            disabled={isLoggingOut}
            aria-disabled={isLoggingOut}
            className={cn(
              'w-full flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
              isCollapsed && 'justify-center',
              isLoggingOut
                ? 'bg-white/10 text-white/60 cursor-not-allowed'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            )}
          >
            {isLoggingOut ? (
              <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0' />
            ) : (
              <LogOut className='w-5 h-5 flex-shrink-0 group-hover:animate-pulse' />
            )}
            {!isCollapsed && (
              <span className='ml-3'>{isLoggingOut ? 'ログアウト中...' : 'ログアウト'}</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
