import { Suspense } from 'react';

import PageClient from '@/components/app/system-admin/PageClient';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getOrganizationStats } from '@/lib/actions/system-admin/organization-stats';
import { getRoleStats } from '@/lib/actions/system-admin/role-stats';
import { getAuditLogsCount, getSystemErrorLogsCount } from '@/lib/actions/system-admin/stats';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { OrganizationStats } from '@/types/organization';

export async function SystemAdminDashboardContent({ authUser }: { authUser: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (!userProfile) {
    throw new Error('ユーザー情報が見つかりません');
  }

  console.log('role:', userProfile.role);
  if (userProfile.role !== 'system-admin') {
    throw new Error(
      'システム管理者権限がありません。あなたの権限は' +
        (userProfile.role === 'admin' ? '管理者' : 'メンバー') +
        'です。'
    );
  }

  const [errorResult, auditResult, roleStats, organizationStats] = await Promise.all([
    getSystemErrorLogsCount(),
    getAuditLogsCount(),
    getRoleStats(),
    getOrganizationStats(),
  ]);

  // エラーハンドリング: 結果がundefinedまたはnullの場合のデフォルト値
  const safeErrorResult = errorResult || { todayCount: 0, yesterdayCount: 0, change: 0 };
  const safeAuditResult = auditResult || { todayCount: 0, yesterdayCount: 0, change: 0 };
  const safeRoleStats = (
    roleStats?.success ? roleStats.data : { systemAdmin: 0, admin: 0, member: 0, total: 0 }
  ) as { systemAdmin: number; admin: number; member: number; total: number };
  const safeOrganizationStats = (
    organizationStats?.success ? organizationStats.data : []
  ) as OrganizationStats[];

  return (
    <PageClient
      errorLogsCnt={safeErrorResult.todayCount}
      errorLogsChn={safeErrorResult.change}
      auditLogsCnt={safeAuditResult.todayCount}
      auditLogsChn={safeAuditResult.change}
      roleStats={safeRoleStats}
      organizationStats={safeOrganizationStats}
    />
  );
}

export default async function SystemAdminDashboard() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error('ログアウトの状態です。ログインしてください。');
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SystemAdminDashboardContent authUser={authUser} />
    </Suspense>
  );
}
