'use client';

import { useState } from 'react';
import { LinkIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const LinkkButton = ({ fragment }: { fragment: string }) => {
  const { toast } = useToast();
  const origin = window.location.origin;
  const pathname = usePathname();
  const [isCopyingLink, setIsCopyingLink] = useState(false);

  const handleLinkToggle = async () => {
    setIsCopyingLink(true);
    try {
      await navigator.clipboard.writeText(`${origin}/${pathname}#${fragment}`);

      toast({
        title: 'リンクのコピー',
        description: 'リンクにコピーされました。',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error copying message:', error);
      toast({
        title: 'リンクのコピー失敗',
        description: 'クリップボードへのリンクのコピーに失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setIsCopyingLink(false);
    }
  };

  return (
    <Button
      variant='ghost'
      size='sm'
      className='h-6 w-6 p-0 hover:bg-gray-100'
      disabled={isCopyingLink}
      onClick={handleLinkToggle}
    >
      <LinkIcon className='w-3 h-3' />
    </Button>
  );
};

export default LinkkButton;
