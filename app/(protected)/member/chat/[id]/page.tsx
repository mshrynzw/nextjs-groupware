import { Suspense } from 'react';

import PageClient from '@/components/app/member/chat/detail/PageClient';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getChatRoom, getMessages } from '@/lib/actions/chat';
import { isFeatureEnabled } from '@/lib/actions/feature';
import { getChatSendKeySetting } from '@/lib/actions/user-settings';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ChatRoom, ChatUser } from '@/schemas/chat';

async function ChatRoomContent({ authUser, chatId }: { authUser: { id: string }; chatId: string }) {
  const supabase = await createSupabaseServerClient();
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (!userProfile) {
    throw new Error('ユーザー情報が見つかりません');
  }

  const isFeatureEnabledResult = await isFeatureEnabled(userProfile.company_id, 'chat');
  if (!isFeatureEnabledResult.success || !isFeatureEnabledResult.data) {
    throw new Error('チャット機能が無効になっています');
  }

  const chatRoomData = await getChatRoom(chatId);
  if (!chatRoomData) {
    throw new Error('チャット情報が見つかりません');
  }

  const messagesData = await getMessages(chatId);
  if (!messagesData) {
    throw new Error('メッセージ情報が見つかりません');
  }

  const chatUsersData = chatRoomData.participants.map((p) => ({
    id: `${chatId}-${p.user_id}`,
    chat_id: chatId,
    user_id: p.user_id,
    role: p.role,
    last_read_message_id: null, // ここはnullで初期化（必要に応じて値をセット）
    last_read_at: p.last_read_at,
    joined_at: p.joined_at,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: undefined,
    left_at: undefined,
    // user_profilesはChatUser型には存在しないので必要なら別途管理
  }));

  const chatSendKeyShiftEnter = await getChatSendKeySetting(userProfile.id);
  if (!chatSendKeyShiftEnter) {
    throw new Error('チャット送信キー設定が見つかりません');
  }

  return (
    <PageClient
      userProfile={userProfile}
      chatId={chatId}
      chatRoomData={chatRoomData as ChatRoom}
      chatUsersData={chatUsersData as ChatUser[]}
      messagesData={messagesData}
      chatSendKeyShiftEnter={chatSendKeyShiftEnter}
    />
  );
}

interface PageProps {
  params: {
    id: string;
  };
}

export default async function MemberChatDetail({ params }: PageProps) {
  const chatId = params.id;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error('ログアウトの状態です。ログインしてください。');
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ChatRoomContent authUser={authUser} chatId={chatId} />
    </Suspense>
  );
}

// import ChatDetail from '@/components/app/member/chat/detail/PageClient';
// import { createSupabaseServerClient } from '@/lib/supabase/server';

// export default async function ChatDetailPage() {
//   // 認証チェックのみ（即座に完了）
//   const supabase = await createSupabaseServerClient();
//   const {
//     data: { user: authUser },
//   } = await supabase.auth.getUser();

//   if (!authUser) {
//     throw new Error('ログアウトの状態です。ログインしてください。');
//   }
//   return (
//     <div className='h-[calc(100vh-8rem)] flex flex-col backdrop-blur-md rounded-lg'>
//       <ChatDetail />
//     </div>
//   );
// }
