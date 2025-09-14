'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { editMessage } from '@/lib/actions/chat';
// import { useAuth } from '@/contexts/auth-context';

interface MessageEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: {
    id: string;
    content: string;
  };
  onMessageEdited: () => void;
}

export default function MessageEditDialog({
  open,
  onOpenChange,
  message,
  onMessageEdited,
}: MessageEditDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [content, setContent] = useState(message.content);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: 'メッセージが空です',
        description: 'メッセージを入力してください。',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: 'ユーザーが認証されていません',
        description: 'ログインし直してください。',
        variant: 'destructive',
      });
      return;
    }

    setIsEditing(true);
    try {
      await editMessage(message.id, content.trim(), user.id);

      toast({
        title: 'メッセージ編集',
        description: 'メッセージの編集が完了しました。',
        variant: 'default',
      });

      onMessageEdited();
      onOpenChange(false);
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: 'メッセージ編集失敗',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setContent(message.content); // 元の内容に戻す
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>メッセージ編集</DialogTitle>
          <DialogDescription>メッセージの内容を編集できます。</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='messageContent'>メッセージ</Label>
            <Textarea
              id='messageContent'
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder='メッセージを入力...'
              className='min-h-[100px] resize-none'
              disabled={isEditing}
            />
          </div>

          <div className='flex justify-end space-x-2 pt-4'>
            <Button variant='outline' onClick={handleCancel} disabled={isEditing}>
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              disabled={isEditing || !content.trim()}
              className='bg-blue-600 hover:bg-blue-700 text-white'
            >
              {isEditing ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
