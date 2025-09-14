import { Suspense } from 'react';

import PageClient from '@/components/app/member/dashboard/PageClient';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getMemberAttendance } from '@/lib/actions/attendance';
import { getRequests } from '@/lib/actions/requests';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { UserProfile } from '@/schemas/user_profile';

async function DashboardContent({ authUser }: { authUser: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (!userProfile) {
    throw new Error('ユーザー情報が見つかりません');
  }

  const attendanceResult = await getMemberAttendance(authUser.id);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD形式
  const todayAttendanceResult = attendanceResult.filter((record) => record.work_date === today)[0];

  const requestsResult = await getRequests(authUser.id);

  return (
    <PageClient
      user={userProfile as UserProfile}
      attendanceResult={attendanceResult}
      todayAttendanceResult={todayAttendanceResult}
      requestsResult={requestsResult.data || []}
    />
  );
}

export default async function MemberDashboard() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error('ログアウトの状態です。ログインしてください。');
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardContent authUser={authUser} />
    </Suspense>
  );
}
