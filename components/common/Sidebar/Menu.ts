// components/sidebar/menu.ts
export type FeatureKey = 'chat' | 'report' | 'schedule';

export type IconKey =
  | 'home'
  | 'clock'
  | 'calendar'
  | 'fileText'
  | 'users'
  | 'settings'
  | 'barChart3'
  | 'building'
  | 'clipboardList'
  | 'activity'
  | 'house'
  | 'messageSquare';

export type MenuItem =
  | { href: string; icon: IconKey; label: string; feature?: string }
  | { href: ''; icon: IconKey; label: string };

export const baseUserMenuItems: MenuItem[] = [
  { href: '/member', icon: 'home', label: 'ダッシュボード' },
  { href: '/member/attendance', icon: 'clock', label: '勤怠' },
  { href: '/member/requests', icon: 'fileText', label: '申請' },
  { href: '/member/leave', icon: 'house', label: '休暇' },
  { href: '/member/schedule', icon: 'calendar', label: 'スケジュール', feature: 'schedule' },
  { href: '/member/report', icon: 'barChart3', label: 'レポート', feature: 'report' },
  { href: '/member/chat', icon: 'messageSquare', label: 'チャット', feature: 'chat' },
  { href: '/member/profile', icon: 'users', label: 'プロフィール' },
];

export const adminMenuItems: MenuItem[] = [
  { href: '/admin', icon: 'home', label: 'ダッシュボード' },
  { href: '/admin/users', icon: 'users', label: 'ユーザー管理' },
  { href: '/admin/group', icon: 'building', label: 'グループ管理' },
  { href: '/admin/attendance', icon: 'clock', label: '勤怠管理' },
  { href: '/admin/requests', icon: 'fileText', label: '申請管理' },
  { href: '/admin/leave', icon: 'house', label: '休暇管理' },
  {
    href: '/admin/report',
    icon: 'clipboardList',
    label: 'レポート管理',
    feature: 'report',
  },
  { href: '/admin/logs', icon: 'activity', label: 'ログ' },
  { href: '/admin/personal-settings', icon: 'users', label: '個人設定' },
  { href: '/admin/settings', icon: 'settings', label: '管理設定' },
];

export const systemAdminMenuItems: MenuItem[] = [
  { href: '/system-admin', icon: 'home', label: 'ダッシュボード' },
  { href: '/system-admin/company', icon: 'building', label: '企業管理' },
  { href: '/system-admin/feature', icon: 'settings', label: '機能管理' },
  { href: '/system-admin/logs', icon: 'activity', label: 'ログ' },
  { href: '/system-admin/system', icon: 'barChart3', label: 'システム管理' },
];
