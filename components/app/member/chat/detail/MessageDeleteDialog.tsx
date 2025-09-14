'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteMessage } from '@/lib/actions/chat';
// import { useAuth } from '@/contexts/auth-context';

interface MessageDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: {
    id: string;
    content: string;
  };
  onMessageDeleted: () => void;
}

export default function MessageDeleteDialog({
  open,
  onOpenChange,
  message,
  onMessageDeleted,
}: MessageDeleteDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user?.id) {
      toast({
        title: 'ユーザーが認証されていません',
        description: 'ログインし直してください。',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMessage(message.id, user.id);

      toast({
        title: 'メッセージ消去',
        description: 'メッセージの消去が完了しました。',
        variant: 'default',
      });

      onMessageDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'メッセージ消去失敗',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>メッセージ消去</DialogTitle>
          <DialogDescription>メッセージを消去しますか？</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label>メッセージ内容</Label>
            <div className='p-3 bg-gray-50 rounded-md border'>
              <p className='text-sm text-gray-700'>{message.content}</p>
            </div>
          </div>

          <div className='flex justify-end space-x-2 pt-4'>
            <Button variant='outline' onClick={handleCancel} disabled={isDeleting}>
              キャンセル
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-red-600 hover:bg-red-700 text-white'
            >
              {isDeleting ? '消去中...' : '消去'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
