import ChatDetail from '@/components/app/member/chat/detail/ChatDetail';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function ChatDetailPage() {
  // 認証チェックのみ（即座に完了）
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error('ログアウトの状態です。ログインしてください。');
  }
  return (
    <div className='h-[calc(100vh-8rem)] flex flex-col backdrop-blur-md rounded-lg'>
      <ChatDetail />
    </div>
  );
}
