'use client';

import { ThumbsUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ChatMessageData } from '@/schemas/chat';

// import { useAuth } from '@/contexts/auth-context';

interface GoodButtonProps {
  message: ChatMessageData;
  isOwnMessage: boolean;
  onGoodUpdate?: (messageId: string, goodUserIds: string[]) => void;
}

export default function GoodButton({ message, isOwnMessage, onGoodUpdate }: GoodButtonProps) {
  const { user } = useAuth();
  const [good, setGood] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 初期値の設定
  useEffect(() => {
    if (user?.id && message.good_user_ids) {
      setGood(message.good_user_ids.includes(user.id));
    }
  }, [user?.id, message.good_user_ids]);

  const handleGoodToggle = async () => {
    if (!user?.id || isUpdating) return;

    setIsUpdating(true);
    try {
      let newGoodUserIds: string[];

      if (good) {
        // いいねを削除
        newGoodUserIds = message.good_user_ids?.filter((id) => id !== user.id) || [];
      } else {
        // いいねを追加
        newGoodUserIds = [...(message.good_user_ids || []), user.id];
      }

      // データベースを更新
      const supabase = await createSupabaseBrowserClient();
      const { error } = await supabase
        .from('chat_messages')
        .update({ good_user_ids: newGoodUserIds })
        .eq('id', message.id);

      if (error) throw error;

      // ローカル状態を更新
      setGood(!good);

      // 親コンポーネントに通知
      if (onGoodUpdate) {
        onGoodUpdate(message.id, newGoodUserIds);
      }
    } catch (error) {
      console.error('Error updating good status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user?.id) return null;

  return (
    <Button
      variant='ghost'
      size='sm'
      className={`h-6 w-6 p-0 ml-1 transition-all duration-200 ${
        good
          ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
      }`}
      onClick={handleGoodToggle}
      disabled={isUpdating || isOwnMessage}
      title={good ? 'いいねを取り消す' : 'いいねする'}
    >
      <ThumbsUp className={`w-3 h-3 ${good ? 'fill-current' : ''}`} />
    </Button>
  );
}
