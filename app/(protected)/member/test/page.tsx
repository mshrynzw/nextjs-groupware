import TestPushSubscription from '@/components/push/TestPushSubscription';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function MemberDashboardPage() {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await supabase.auth.getUser();
    console.log('user', user);

    // 一時的に認証チェックを無効化
    const userId = user.data.user?.id || 'test-user-id';
    const userEmail = user.data.user?.email || 'test@example.com';

    return (
      <div>
        <h1>メンバーダッシュボード</h1>
        <div>ユーザー: {userEmail}</div>
        <TestPushSubscription userId={userId} />
      </div>
    );
  } catch (error) {
    console.error('Error in MemberDashboardPage:', error);
    return (
      <div>
        <h1>エラーが発生しました</h1>
        <p>エラー詳細: {error instanceof Error ? error.message : 'Unknown error'}</p>
        <p>スタックトレース: {error instanceof Error ? error.stack : 'No stack trace'}</p>
      </div>
    );
  }
}
