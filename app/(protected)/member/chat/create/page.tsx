import { Suspense } from 'react';

import PageClient from '@/components/app/member/chat/create/PageClient';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getCompanyUsers } from '@/lib/actions/user';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { UserProfile } from '@/schemas/user_profile';

// プロフィール取得とチャットデータ取得の非同期コンポーネント
async function ChatCreateContent({ authUser }: { authUser: { id: string } }) {
  const supabase = await createSupabaseServerClient();

  // ユーザープロフィールを取得
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select(
      `
      *,
      user_groups!inner(group_id)
    `
    )
    .eq('id', authUser.id)
    .single();

  if (!userProfile) {
    throw new Error('ユーザー情報が見つかりません');
  }

  if (userProfile.feature_chat === false || userProfile.feature_chat === null) {
    throw new Error('チャット機能が無効になっています');
  }
  const companyUsers = await getCompanyUsers({
    userId: authUser.id,
    companyId: userProfile.company_id,
  });
  console.log('companyUsers', companyUsers);

  if (!companyUsers.success) {
    throw new Error('企業ユーザー一覧が見つかりません');
  }

  return <PageClient user={userProfile} users={companyUsers.data as UserProfile[]} />;
}

export default async function MemberChatCreate() {
  // 認証チェックのみ（即座に完了）
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error('ログアウトの状態です。ログインしてください。');
  }

  // プロフィール取得とチャットデータ取得をSuspenseでラップ
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ChatCreateContent authUser={authUser} />
    </Suspense>
  );
}
