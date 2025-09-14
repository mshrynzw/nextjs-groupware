'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/contexts/auth-context';
import ChatRoom from '@/components/app/member/chat/room/ChatRoom';

import { getCompanyFeaturesByUserId } from '@/lib/actions/get-company-features';

export default function ChatDetail() {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!user) return;
    (async () => {
      const features = await getCompanyFeaturesByUserId(user.id);
      if (features && !features.features.chat) {
        router.replace('/member/feature-disabled');
      }
    })();
  }, [user, router]);
  return (
    <div className='h-[calc(100vh-8rem)] flex flex-col backdrop-blur-md rounded-lg'>
      <ChatRoom />
    </div>
  );
}
