import { ArrowLeft, Settings, Users } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import ExitChatButton from '@/components/app/member/chat/ExitChatButton';

export default function ChatHeader({
  chat,
  chatUsers,
  user,
  setSettingsDialogOpen,
  isParticipant,
  chatId,
  getChatDisplayName,
  router,
}: {
  chat: any;
  chatUsers: any[];
  user: any;
  setSettingsDialogOpen: (open: boolean) => void;
  isParticipant: boolean;
  chatId: string;
  getChatDisplayName: () => string;
  router: any;
}) {
  return (
    <div className='p-4 border-b bg-white/70 backdrop-blur-md rounded-t-lg'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push('/member/chat')}
            className='mr-2'
          >
            <ArrowLeft className='w-4 h-4' />
          </Button>
          <Avatar className='w-8 h-8'>
            <AvatarFallback className='bg-blue-500 text-white'>
              {chat!.chat_type === 'channel' ? (
                <Users className='w-4 h-4' />
              ) : (
                getChatDisplayName().charAt(0)
              )}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className='font-medium'>{getChatDisplayName()}</h3>
            <p className='text-sm text-gray-500'>
              {chat.chat_type === 'channel'
                ? `${chat.participants?.length || 0}人のメンバー`
                : 'ダイレクトチャット'}
            </p>
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <Button variant='ghost' size='sm'>
            <Users className='w-4 h-4' />
          </Button>
          {/* 管理者のみ設定アイコンを表示 */}
          {chatUsers.some((cu) => cu.user_id === user!.id && cu.role === 'admin') && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setSettingsDialogOpen(true)}
              title='チャット設定'
            >
              <Settings className='w-4 h-4' />
            </Button>
          )}
          {/* 退室ボタン */}
          <ExitChatButton
            chatId={chatId}
            chatName={getChatDisplayName()}
            isParticipant={isParticipant}
            isAdmin={chatUsers.some((cu) => cu.user_id === user!.id && cu.role === 'admin')}
            participantCount={chat.participants?.length || 0}
          />
        </div>
      </div>
    </div>
  );
}
