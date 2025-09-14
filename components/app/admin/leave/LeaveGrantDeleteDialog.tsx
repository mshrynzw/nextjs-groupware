'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteLeaveGrant } from '@/lib/actions/leave-grants';

interface LeaveGrantDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveGrantId: string | null;
  onSuccess: () => void;
  selectedIds?: Set<string>; // 一括削除用
}

export default function LeaveGrantDeleteDialog({
  open,
  onOpenChange,
  leaveGrantId,
  selectedIds,
  onSuccess,
}: LeaveGrantDeleteDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!leaveGrantId && (!selectedIds || selectedIds.size === 0)) return;

    setIsLoading(true);
    try {
      let success = true;
      let errorMessage = '';

      if (selectedIds && selectedIds.size > 0) {
        // 一括削除
        const deletePromises = Array.from(selectedIds).map((id) => deleteLeaveGrant(id));
        const results = await Promise.all(deletePromises);

        const failedResults = results.filter((result) => !result.success);
        if (failedResults.length > 0) {
          success = false;
          errorMessage = failedResults.map((r) => r.error).join(', ');
        }
      } else {
        // 単一削除
        const result = await deleteLeaveGrant(leaveGrantId!);
        success = result.success;
        errorMessage = result.error || '';
      }

      if (success) {
        const count = selectedIds ? selectedIds.size : 1;
        toast({
          title: '削除完了',
          description: `${count}件の休暇付与を削除しました。`,
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: '削除失敗',
          description: errorMessage || '削除に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '削除失敗',
        description: '削除に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <Trash2 className='w-5 h-5 text-red-600' />
            <span>休暇付与削除</span>
          </DialogTitle>
          <DialogDescription>
            {selectedIds && selectedIds.size > 0
              ? `${selectedIds.size}件の休暇付与を削除しますか？この操作は取り消せません。`
              : 'この休暇付与を削除しますか？この操作は取り消せません。'}
          </DialogDescription>
        </DialogHeader>
        <div className='flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-md'>
          <AlertTriangle className='w-5 h-5 text-red-600' />
          <span className='text-sm text-red-700'>
            削除されたデータは復元できません。本当に削除しますか？
          </span>
        </div>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={handleCancel} disabled={isLoading}>
            キャンセル
          </Button>
          <Button type='button' variant='destructive' onClick={handleDelete} disabled={isLoading}>
            {isLoading ? '削除中...' : '削除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
