'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface MessageCopyButtonProps {
  messageContent: string;
  className?: string;
}

export default function MessageCopyButton({ messageContent, className }: MessageCopyButtonProps) {
  const { toast } = useToast();
  const [isCopying, setIsCopying] = useState(false);

  const handleCopy = async () => {
    if (!messageContent.trim()) {
      toast({
        title: 'コピーに失敗しました',
        description: 'コピーするメッセージがありません。',
        variant: 'destructive',
      });
      return;
    }

    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(messageContent);

      toast({
        title: 'メッセージのコピー',
        description: 'クリップボードにコピーされました。',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error copying message:', error);
      toast({
        title: 'コピー失敗',
        description: 'クリップボードへのコピーに失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <Button
      variant='ghost'
      size='sm'
      className={`h-6 w-6 p-0 hover:bg-gray-100 ${className || ''}`}
      onClick={handleCopy}
      disabled={isCopying}
      title='メッセージをコピー'
    >
      <Copy className='w-3 h-3' strokeWidth={3} />
    </Button>
  );
}
