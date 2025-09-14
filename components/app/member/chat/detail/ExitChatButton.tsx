'use client';

import { DoorOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

import ExitChatDialog from './ExitChatDialog';

// import { useAuth } from '@/contexts/auth-context';

interface ExitChatButtonProps {
  chatId: string;
  chatName: string;
  isParticipant: boolean;
  isAdmin: boolean;
  participantCount: number;
}

export default function ExitChatButton({
  chatId,
  chatName,
  isParticipant,
  isAdmin,
  participantCount,
}: ExitChatButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // 参加していない場合、管理者の場合、最後の参加者の場合はボタンを非表示
  if (!isParticipant || isAdmin || participantCount <= 1) {
    return null;
  }

  const handleExitChat = async () => {
    if (!user?.id) return;

    setIsExiting(true);
    try {
      // chat_usersテーブルから物理削除
      const { error } = await createSupabaseBrowserClient
        .from('chat_users')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', user.id);

      if (error) throw error;

      // 成功時のトースト表示
      toast({
        title: 'チャット退室',
        description: `${chatName}を退室しました`,
        variant: 'default',
      });

      // チャット一覧ページにリダイレクト
      router.push('/member/chat');
    } catch (error) {
      console.error('Error exiting chat:', error);
      toast({
        title: 'エラー',
        description: 'チャットからの退室に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsExiting(false);
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        className='bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 ml-2'
        disabled={isExiting}
      >
        {isExiting ? '退室中...' : <DoorOpen className='w-4 h-4' />}
      </Button>

      <ExitChatDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        chatName={chatName}
        onConfirm={handleExitChat}
        isExiting={isExiting}
      />
    </>
  );
}
