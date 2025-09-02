// components/sidebar/menu.ts
import type { LucideIcon } from 'lucide-react';
import {
  Home,
  Clock,
  Calendar,
  FileText,
  Users,
  Settings,
  BarChart3,
  Building,
  ClipboardList,
  Activity,
  House,
  MessageSquare,
} from 'lucide-react';

export type FeatureKey = 'chat' | 'report' | 'schedule';

export type MenuItem =
  | { href: string; icon: LucideIcon; label: string; feature?: FeatureKey }
  | { href: ''; label: string };

export const baseUserMenuItems: MenuItem[] = [
  { href: '/member', icon: Home, label: 'ダッシュボード' },
  { href: '/member/attendance', icon: Clock, label: '勤怠' },
  { href: '/member/requests', icon: FileText, label: '申請' },
  { href: '/member/schedule', icon: Calendar, label: 'スケジュール', feature: 'schedule' },
  { href: '/member/report', icon: BarChart3, label: 'レポート', feature: 'report' },
  { href: '/member/chat', icon: MessageSquare, label: 'チャット', feature: 'chat' },
  { href: '/member/profile', icon: Users, label: 'プロフィール' },
];

export const adminMenuItems: MenuItem[] = [
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
    feature: 'report',
  },
  { href: '/admin/logs', icon: Activity, label: 'ログ' },
  { href: '/admin/settings', icon: Settings, label: '設定' },
];

export const systemAdminMenuItems: MenuItem[] = [
  { href: '/system-admin', icon: Home, label: 'ダッシュボード' },
  { href: '/system-admin/company', icon: Building, label: '企業管理' },
  { href: '/system-admin/features', icon: Settings, label: '機能管理' },
  { href: '/system-admin/logs', icon: Activity, label: 'ログ' },
  { href: '/system-admin/system', icon: BarChart3, label: 'システム管理' },
];
