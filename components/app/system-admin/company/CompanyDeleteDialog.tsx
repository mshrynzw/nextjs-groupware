'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Company } from '@/schemas/company';

// import { useAuth } from '@/contexts/auth-context';
import { deleteCompany } from '@/lib/actions/system-admin/company';

export default function CompanyDeleteDialog({
  open,
  onOpenChangeAction,
  company,
}: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  company: Company | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const handleDelete = async () => {
    if (!company) return;
    setLoading(true);
    setError(null);

    try {
      const result = await deleteCompany(company.id, currentUser?.id);

      if (result.success) {
        onOpenChangeAction(false);
      } else {
        // エラーハンドリング
        setError(result.error.message);
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className='dialog-scrollbar'>
        <DialogHeader>
          <DialogTitle>本当に削除しますか？</DialogTitle>
          <DialogDescription>
            この操作は取り消せません。選択した企業「{company?.name}」を削除します。
          </DialogDescription>
        </DialogHeader>
        {error && <div className='text-destructive text-sm mb-2'>{error}</div>}
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChangeAction(false)} disabled={loading}>
            キャンセル
          </Button>
          <Button onClick={handleDelete} disabled={loading} variant='destructive'>
            {loading ? '削除中...' : 'OK'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
