'use client';

import {
  Home,
  Clock,
  Calendar,
  FileText,
  Users,
  Settings,
  LogOut,
  BarChart3,
  Building,
  ChevronRight,
  ChevronLeft,
  User as UserIcon,
  MessageSquare,
  ClipboardList,
  Activity,
  House,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';
// import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

type Role = 'member' | 'admin' | 'system-admin';
type FeatureKey = 'chat' | 'report' | 'schedule';

interface SidebarClientProps {
  isOpen?: boolean;
  onToggle?: () => void;
  user: {
    full_name: string;
    role: Role;
  };
  // サーバーで取得して渡す
  features: Record<FeatureKey, boolean> | null;
}

const baseUserMenuItems = [
  { href: '/member', icon: Home, label: 'ダッシュボード' },
  { href: '/member/attendance', icon: Clock, label: '勤怠' },
  { href: '/member/requests', icon: FileText, label: '申請' },
  { href: '/member/schedule', icon: Calendar, label: 'スケジュール', feature: 'schedule' as const },
  { href: '/member/report', icon: BarChart3, label: 'レポート', feature: 'report' as const },
  { href: '/member/chat', icon: MessageSquare, label: 'チャット', feature: 'chat' as const },
  { href: '/member/profile', icon: Users, label: 'プロフィール' },
];

const adminMenuItems = [
  { href: '/admin', icon: Home, label: 'ダッシュボード' },
  { href: '/admin/users', icon: Users, label: 'ユーザー管理' },
  { href: '/admin/group', icon: Building, label: 'グループ管理' },
  { href: '/admin/attendance', icon: Clock, label: '勤怠管理' },
  { href: '/admin/requests', icon: FileText, label: '申請管理' },
  { href: '/admin/leave', icon: House, label: '休暇管理' },
  {
    href: '/admin/report-templates',
    icon: ClipboardList,
    label: 'レポート管理',
    feature: 'report' as const,
  },
  { href: '/admin/logs', icon: Activity, label: 'ログ' },
  { href: '/admin/settings', icon: Settings, label: '設定' },
];

const systemAdminMenuItems = [
  { href: '/system-admin', icon: Home, label: 'ダッシュボード' },
  { href: '/system-admin/company', icon: Building, label: '企業管理' },
  { href: '/system-admin/features', icon: Settings, label: '機能管理' },
  { href: '/system-admin/logs', icon: Activity, label: 'ログ' },
  { href: '/system-admin/system', icon: BarChart3, label: 'システム管理' },
];

export default function SidebarClient({
  isOpen = false,
  onToggle,
  user,
  features,
}: SidebarClientProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  // ログアウトはクライアントの文脈（コンテキスト）で実行
  // const { logout, isLoggingOut } = useAuth();

  const logout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isFeatureEnabled = (feature: FeatureKey) => {
    if (user.role === 'system-admin') return true;
    if (!features) return true; // 受け取り前は一旦全表示（UX）
    return features[feature] ?? true;
  };

  const getMenuItems = () => {
    const filteredUserMenuItems = baseUserMenuItems.filter((item) => {
      if (item.feature) return isFeatureEnabled(item.feature);
      return true;
    });

    if (user.role === 'admin' && pathname.startsWith('/member')) return filteredUserMenuItems;
    if (user.role === 'system-admin' && pathname.startsWith('/member'))
      return filteredUserMenuItems;

    switch (user.role) {
      case 'system-admin':
        return systemAdminMenuItems;
      case 'admin':
        return adminMenuItems;
      case 'member':
      default:
        return filteredUserMenuItems;
    }
  };

  const menuItems = getMenuItems();

  const sidebarClasses = cn(
    'fixed left-0 top-0 z-50 h-full min-h-screen timeport-sidebar text-white transition-all duration-300 shadow-2xl flex flex-col',
    'lg:relative lg:z-0 lg:translate-x-0',
    isOpen && 'mobile-open',
    isCollapsed ? 'w-16' : 'w-64'
  );

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 lg:hidden z-40" onClick={() => onToggle?.()} />
      )}

      <aside className={sidebarClasses}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className={cn('flex items-center space-x-3', isCollapsed && 'justify-center')}>
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">T</span>
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold">TimePort</h1>
                <p className="text-xs text-white/80">時間管理システム</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="lg:block hidden p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-white/20">
          <div className={cn('flex items-center space-x-3', isCollapsed && 'justify-center')}>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.full_name}</p>
                <p className="text-xs text-white/80 truncate">
                  {user.role === 'system-admin'
                    ? 'システム管理者'
                    : user.role === 'admin'
                      ? '管理者'
                      : 'メンバー'}
                </p>
              </div>
            )}

            {user.role !== 'member' && (
              <div className="lg:hidden flex space-x-1">
                {pathname.startsWith('/admin') && user.role !== 'system-admin' && (
                  <button
                    onClick={() => {
                      router.push('/member');
                      onToggle?.();
                    }}
                    className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                    title="メンバー画面"
                  >
                    <Users className="w-4 h-4 text-white" />
                  </button>
                )}

                {pathname.startsWith('/member') && (
                  <button
                    onClick={() => {
                      if (user.role === 'system-admin') router.push('/system-admin');
                      else router.push('/admin');
                      onToggle?.();
                    }}
                    className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                    title="管理者画面"
                  >
                    <Settings className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
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
                    ? 'bg-white/20 text-white backdrop-blur-sm shadow-lg border border-white/30'
                    : 'text-white/80 hover:bg-white/10 hover:text-white transform hover:scale-[1.02]',
                  isCollapsed && 'justify-center'
                )}
                prefetch={true}
                onClick={onToggle} // モバイルでメニュー項目クリック時にサイドバーを閉じる
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'animate-pulse')} />
                {!isCollapsed && <span className="ml-3">{item.label}</span>}
                {!isCollapsed && isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/20 mt-auto">
          <button
            onClick={logout}
            disabled={isLoggingOut}
            className={cn(
              'w-full flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
              isCollapsed && 'justify-center',
              isLoggingOut
                ? 'bg-white/10 text-white/60 cursor-not-allowed'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            )}
          >
            {isLoggingOut ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
            ) : (
              <LogOut className="w-5 h-5 flex-shrink-0 group-hover:animate-pulse" />
            )}
            {!isCollapsed && (
              <span className="ml-3">{isLoggingOut ? 'ログアウト中...' : 'ログアウト'}</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
