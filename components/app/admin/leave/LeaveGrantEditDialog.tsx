'use client';

import { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { updateLeaveGrant, getLeaveGrantById } from '@/lib/actions/leave-grants';

interface LeaveGrantEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveGrantId: string | null;
  onSuccess: () => void;
  users: Array<{ id: string; family_name?: string; first_name?: string; email?: string }>;
  leaveTypes: Array<{ id: string; name: string }>;
}

export default function LeaveGrantEditDialog({
  open,
  onOpenChange,
  leaveGrantId,
  onSuccess,
  users,
  leaveTypes,
}: LeaveGrantEditDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    leaveTypeId: '',
    quantityMinutes: 0,
    grantedOn: '',
    expiresOn: '',
    note: '',
  });

  // データ取得
  useEffect(() => {
    if (open && leaveGrantId) {
      fetchLeaveGrantData();
    }
  }, [open, leaveGrantId]);

  const fetchLeaveGrantData = async () => {
    if (!leaveGrantId) return;

    setIsLoading(true);
    try {
      const result = await getLeaveGrantById(leaveGrantId);
      if (result.success && result.data) {
        const data = result.data;
        setFormData({
          userId: data.user_id,
          leaveTypeId: data.leave_type_id,
          quantityMinutes: data.quantity_minutes,
          grantedOn: data.granted_on,
          expiresOn: data.expires_on || '',
          note: data.note || '',
        });
      } else {
        toast({
          title: 'エラー',
          description: result.error || 'データの取得に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'データの取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveGrantId) return;

    if (!formData.userId || !formData.leaveTypeId || !formData.grantedOn) {
      toast({
        title: '入力エラー',
        description: 'ユーザー、休暇種別、付与日は必須です。',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateLeaveGrant({
        id: leaveGrantId,
        userId: formData.userId,
        leaveTypeId: formData.leaveTypeId,
        quantityMinutes: formData.quantityMinutes,
        grantedOn: formData.grantedOn,
        expiresOn: formData.expiresOn || null,
        note: formData.note,
      });

      if (result.success) {
        toast({
          title: '更新完了',
          description: '休暇付与を更新しました。',
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: '更新失敗',
          description: result.error || '更新に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '更新失敗',
        description: '更新に失敗しました',
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
            <Edit className='w-5 h-5 text-green-600' />
            <span>休暇付与編集</span>
          </DialogTitle>
          <DialogDescription>休暇付与の情報を編集できます</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='userId'>ユーザー</Label>
            <select
              id='userId'
              className='w-full h-9 border rounded-md px-2'
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              disabled={isLoading}
              required
            >
              <option value=''>選択してください</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {`${u.family_name || ''} ${u.first_name || ''}`.trim() || u.email || u.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor='leaveTypeId'>休暇種別</Label>
            <select
              id='leaveTypeId'
              className='w-full h-9 border rounded-md px-2'
              value={formData.leaveTypeId}
              onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
              disabled={isLoading}
              required
            >
              <option value=''>選択してください</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor='quantityMinutes'>付与分（分）</Label>
            <Input
              id='quantityMinutes'
              type='number'
              value={formData.quantityMinutes}
              onChange={(e) =>
                setFormData({ ...formData, quantityMinutes: Number(e.target.value || 0) })
              }
              disabled={isLoading}
              required
            />
          </div>
          <div>
            <Label htmlFor='grantedOn'>付与日</Label>
            <Input
              id='grantedOn'
              type='date'
              value={formData.grantedOn}
              onChange={(e) => setFormData({ ...formData, grantedOn: e.target.value })}
              disabled={isLoading}
              required
            />
          </div>
          <div>
            <Label htmlFor='expiresOn'>失効日（任意）</Label>
            <Input
              id='expiresOn'
              type='date'
              value={formData.expiresOn}
              onChange={(e) => setFormData({ ...formData, expiresOn: e.target.value })}
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor='note'>メモ</Label>
            <Input
              id='note'
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={handleCancel} disabled={isLoading}>
              キャンセル
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? '更新中...' : '更新'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
