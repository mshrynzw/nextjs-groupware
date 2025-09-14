'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface JoinChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatName: string;
  onConfirm: () => void;
  isJoining: boolean;
}

export default function JoinChatDialog({
  open,
  onOpenChange,
  chatName,
  onConfirm,
  isJoining,
}: JoinChatDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>チャット参加</DialogTitle>
          <DialogDescription>{chatName}に参加しますか。</DialogDescription>
        </DialogHeader>

        <div className='flex justify-end space-x-2 pt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isJoining}>
            キャンセル
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isJoining}
            className='bg-blue-600 hover:bg-blue-700 text-white'
          >
            {isJoining ? '参加中...' : '参加する'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
