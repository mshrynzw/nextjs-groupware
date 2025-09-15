import { Suspense } from 'react';

import PageClient from '@/components/app/member/chat/create/PageClient';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getChannelsByCompany } from '@/lib/actions/chat';
import { getGroupsByCompany, getUserGroupsWithMembers } from '@/lib/actions/groups';
import { getCompanyUsers } from '@/lib/actions/user';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Channel } from '@/schemas/chat';
import { Group } from '@/schemas/group';
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

  if (!companyUsers.success) {
    throw new Error('企業ユーザー一覧が見つかりません');
  }

  const userGroupsWithMembers = await getUserGroupsWithMembers(
    userProfile.company_id,
    userProfile.id
  );
  if (userGroupsWithMembers.length === 0) {
    throw new Error('ユーザーグループが見つかりませんでした');
  }

  const groups = await getGroupsByCompany(userProfile.company_id);
  if (groups.length === 0) {
    throw new Error('グループが見つかりませんでした');
  }

  const channels = await getChannelsByCompany(userProfile.company_id);
  if (channels.length === 0) {
    throw new Error('チャンネルが見つかりませんでした');
  }

  return (
    <PageClient
      user={userProfile}
      users={companyUsers.data as UserProfile[]}
      groups={groups as Group[]}
      userGroupsWithMembers={userGroupsWithMembers}
      channels={channels as Channel[]}
    />
  );
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
