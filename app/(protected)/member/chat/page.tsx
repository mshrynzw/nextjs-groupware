import { Suspense } from 'react';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getChats } from '@/lib/actions/chat';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PageClient from '@/components/app/member/chat/PageClient';

// プロフィール取得とチャットデータ取得の非同期コンポーネント
async function ChatContent({ authUser }: { authUser: { id: string } }) {
  const supabase = await createSupabaseServerClient();

  // ユーザープロフィールを取得
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (!userProfile) {
    throw new Error('ユーザー情報が見つかりません');
  }

  if (userProfile.feature_chat === false || userProfile.feature_chat === null) {
    throw new Error('チャット機能が無効になっています');
  }

  // チャットデータを取得
  const chats = await getChats(userProfile.id, userProfile.company_id);
  return <PageClient user={userProfile} chats={chats} />;
}

export default async function MemberChat() {
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
      <ChatContent authUser={authUser} />
    </Suspense>
  );
}
