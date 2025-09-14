'use client';

import { Menu } from 'lucide-react';

import { LogoutButton } from '@/components/common/header/LogoutButton';
import { SearchInput } from '@/components/common/header/SearchInput';
import { Button } from '@/components/ui/button';
import type { Role, User } from '@/types/user';
// import NotificationSystem from '@  /components/notifications/NotificationSystem';

interface HeaderProps {
  user: User;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Header({ user, setIsOpen }: HeaderProps) {
  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'system-admin':
        return 'システム管理者';
      case 'admin':
        return '管理者';
      case 'member':
      default:
        return 'メンバー';
    }
  };

  return (
    <header className='h-16 timeport-header text-white flex items-center justify-between px-4 lg:px-6 shadow-lg relative z-20 overflow-hidden'>
      <div className='flex items-center space-x-2 lg:space-x-4 min-w-0'>
        <Button
          variant='ghost'
          size='icon'
          className='lg:hidden text-white hover:bg-white/10 flex-shrink-0'
          onClick={() => setIsOpen(true)}
        >
          <Menu className='w-5 h-5' />
        </Button>
        <SearchInput />
      </div>

      <div className='flex items-center space-x-1 lg:space-x-2 min-w-0'>
        <div className='flex items-center space-x-1 lg:space-x-2 min-w-0'>
          <div className='w-7 h-7 lg:w-8 lg:h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 flex-shrink-0'>
            <span className='text-xs font-medium text-white'>{user.full_name?.charAt(0)}</span>
          </div>
          <div className='hidden sm:block min-w-0'>
            <div className='text-xs lg:text-sm font-medium text-white truncate'>
              {user.full_name}
            </div>
            <div className='text-xs text-white/70 truncate'>{getRoleLabel(user.role)}</div>
          </div>
        </div>

        <div className='flex-shrink-0'>
          {/* <NotificationSystem
            onNotificationClick={(notification) => {
              if (notification.related_request_id) {
                router.push(`/member/requests/${notification.related_request_id}`);
              }
            }}
          /> */}
        </div>

        {/* ログアウトボタン */}
        <LogoutButton user={user} />
      </div>
    </header>
  );
}
