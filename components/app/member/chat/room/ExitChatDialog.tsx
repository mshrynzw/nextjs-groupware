'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ExitChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatName: string;
  onConfirm: () => void;
  isExiting: boolean;
}

export default function ExitChatDialog({
  open,
  onOpenChange,
  chatName,
  onConfirm,
  isExiting,
}: ExitChatDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>チャット退室</DialogTitle>
          <DialogDescription>{chatName}を退室しますか。</DialogDescription>
        </DialogHeader>

        <div className='flex justify-end space-x-2 pt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isExiting}>
            キャンセル
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isExiting}
            className='bg-red-100 hover:bg-red-200 text-red-700 border border-red-300'
          >
            {isExiting ? '退室中...' : '退室する'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
