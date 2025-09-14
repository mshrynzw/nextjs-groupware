'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

import JoinChatDialog from './JoinChatDialog';

// import { useAuth } from '@/contexts/auth-context';

interface JoinChatButtonProps {
  chatId: string;
  chatName: string;
  isParticipant: boolean;
  onJoinSuccess?: () => void;
}

export default function JoinChatButton({
  chatId,
  chatName,
  isParticipant,
  onJoinSuccess,
}: JoinChatButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // 参加していない場合のみボタンを表示
  if (isParticipant) {
    return null;
  }

  const handleJoinChat = async () => {
    if (!user?.id) return;

    setIsJoining(true);
    try {
      // chat_usersテーブルに挿入
      const { error } = await supabase.from('chat_users').insert({
        chat_id: chatId,
        user_id: user.id,
        role: 'member',
      });

      if (error) throw error;

      // 成功時のトースト表示
      toast({
        title: 'チャット参加',
        description: `${chatName}に参加しました`,
        variant: 'default',
      });

      // 親コンポーネントに参加成功を通知
      if (onJoinSuccess) {
        onJoinSuccess();
      }
    } catch (error) {
      console.error('Error joining chat:', error);
      toast({
        title: 'エラー',
        description: 'チャットへの参加に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        className='bg-blue-600 hover:bg-blue-700 text-white ml-4'
        disabled={isJoining}
      >
        {isJoining ? '参加中...' : '参加する'}
      </Button>

      <JoinChatDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        chatName={chatName}
        onConfirm={handleJoinChat}
        isJoining={isJoining}
      />
    </>
  );
}
