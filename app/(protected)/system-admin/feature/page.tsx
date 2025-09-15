import { Suspense } from 'react';

import PageClient from '@/components/app/system-admin/feature/PageClient';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getCompanies } from '@/lib/actions/company';
import { getAllCompanyFeatures } from '@/lib/actions/feature';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { UserProfile } from '@/schemas/user_profile';

async function SystemAdminFeatureContent({ authUser }: { authUser: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();
  if (!userProfile) {
    throw new Error('ユーザー情報が見つかりません');
  }
  if (userProfile.role !== 'system-admin') {
    throw new Error(
      'システム管理者権限がありません。あなたの権限は' +
        (userProfile.role === 'admin' ? '管理者' : 'メンバー') +
        'です。'
    );
  }

  const companiesResult = await getCompanies({
    orderBy: 'created_at',
    ascending: false,
  });
  if (!companiesResult.success) {
    throw new Error('企業データの取得に失敗しました（' + companiesResult.error.message + '）');
  }

  const featuresResult = await getAllCompanyFeatures();
  if (!featuresResult.success) {
    throw new Error('機能データの取得に失敗しました（' + featuresResult.error.message + '）');
  }

  return (
    <PageClient
      user={userProfile as UserProfile}
      companies={companiesResult.data.companies}
      companyFeaturesData={featuresResult.data}
    />
  );
}

export default async function SystemAdminFeature() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error('ログアウトの状態です。ログインしてください。');
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SystemAdminFeatureContent authUser={authUser} />
    </Suspense>
  );
}
