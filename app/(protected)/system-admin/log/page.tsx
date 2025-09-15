import { Suspense } from 'react';

import PageClient from '@/components/app/system-admin/log/PageClient';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getAuditLogs, getSystemLogs } from '@/lib/actions/log';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { UserProfile } from '@/schemas/user_profile';

export async function SystemAdminLogContent({ authUser }: { authUser: { id: string } }) {
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

  const systemLogsResult = await getSystemLogs();
  if (!systemLogsResult.success) {
    throw new Error('システムログの取得に失敗しました（' + systemLogsResult.error.message + '）');
  }
  const systemLogsData = systemLogsResult.data;
  const systemLogsCount = systemLogsResult.count;

  const auditLogsResult = await getAuditLogs();
  if (!auditLogsResult.success) {
    throw new Error('監査ログの取得に失敗しました（' + auditLogsResult.error.message + '）');
  }
  const auditLogsData = auditLogsResult.data;
  const auditLogsCount = auditLogsResult.count;

  return (
    <PageClient
      user={userProfile as UserProfile}
      systemLogsData={systemLogsData}
      systemLogsCount={systemLogsCount}
      auditLogsData={auditLogsData}
      auditLogsCount={auditLogsCount}
    />
  );
}

export default async function SystemAdminLog() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error('ログアウトの状態です。ログインしてください。');
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SystemAdminLogContent authUser={authUser} />
    </Suspense>
  );
}
