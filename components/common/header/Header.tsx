import { Menu } from 'lucide-react';

import { LogoutButton } from '@/components/common/header/LogoutButton';
import { SearchInput } from '@/components/common/header/SearchInput';
// import NotificationSystem from '@/components/notifications/NotificationSystem';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 timeport-header text-white flex items-center justify-between px-4 lg:px-6 shadow-lg relative z-20 overflow-hidden">
      <div className="flex items-center space-x-2 lg:space-x-4 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-white hover:bg-white/10 flex-shrink-0"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>

        <SearchInput />
      </div>

      <div className="flex items-center space-x-1 lg:space-x-2 min-w-0">
        <div className="flex items-center space-x-1 lg:space-x-2 min-w-0">
          <div className="w-7 h-7 lg:w-8 lg:h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 flex-shrink-0">
            <span className="text-xs font-medium text-white">
              {/* {user?.full_name?.charAt(0) || 'U'} */}
              {/* TODO: ユーザー名の最初の文字を表示 */}田
            </span>
          </div>
          <div className="hidden sm:block min-w-0">
            <div className="text-xs lg:text-sm font-medium text-white truncate">
              {/* {user?.full_name} */}
              {/* TODO: ユーザー名を表示 */}
              田中太郎
            </div>
            <div className="text-xs text-white/70 truncate">
              {/* {user?.role === 'system-admin'
                ? 'システム管理者'
                : user?.role === 'admin'
                  ? '管理者'
                  : 'メンバー'} */}
              {/* TODO: ロールによって表示を変える */}
              システム管理者
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          {/* <NotificationSystem
            onNotificationClick={(notification) => {
              if (notification.related_request_id) {
                router.push(`/member/requests/${notification.related_request_id}`);
              }
            }}
          /> */}
        </div>

        {/* ログアウトボタン */}
        <LogoutButton />
      </div>
    </header>
  );
}
