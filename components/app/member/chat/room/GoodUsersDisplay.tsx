'use client';

import { useEffect, useState } from 'react';

import { ChatMessageData } from '@/schemas/chat';

interface GoodUsersDisplayProps {
  message: ChatMessageData;
}

interface GoodUser {
  id: string;
  family_name: string;
  first_name: string;
}

export default function GoodUsersDisplay({ message }: GoodUsersDisplayProps) {
  const [goodUsers, setGoodUsers] = useState<GoodUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // いいねしたユーザーの情報を取得
  useEffect(() => {
    if (!message.good_user_ids || message.good_user_ids.length === 0) {
      setGoodUsers([]);
      return;
    }

    const fetchGoodUsers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, family_name, first_name')
          .in('id', message.good_user_ids)
          .is('deleted_at', null);

        if (error) throw error;
        setGoodUsers(data || []);
      } catch (error) {
        console.error('Error fetching good users:', error);
        setGoodUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoodUsers();
  }, [message.good_user_ids]);

  if (isLoading) {
    return <span className='text-xs text-gray-400 ml-1'>読み込み中...</span>;
  }

  if (goodUsers.length === 0) {
    return null;
  }

  // いいねした人の氏名を表示
  const displayNames = goodUsers.map((user) => `${user.family_name} ${user.first_name}`).join(', ');

  return <span className='text-xs text-gray-500 ml-1'>{displayNames}</span>;
}
