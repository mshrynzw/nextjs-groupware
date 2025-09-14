import { X, Settings, Download, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StandardButton } from '@/components/ui/standard-button';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';

const AttendanceHeaderButton = ({
  handleResetFilters,
  setIsColumnSettingsDialogOpen,
  setCsvExportOpen,
  users,
}: {
  handleResetFilters: () => void;
  setIsColumnSettingsDialogOpen: (open: boolean) => void;
  setCsvExportOpen: (open: boolean) => void;
  users: { id: string; name: string; code?: string }[];
}) => {
  return (
    <div className='flex flex-row items-center justify-center space-x-2'>
      <Button variant='outline' size='sm' onClick={handleResetFilters}>
        <X className='w-4 h-4' />
        <span className='hidden md:block'>フィルターリセット</span>
      </Button>
      <Button variant='outline' size='sm' onClick={() => setIsColumnSettingsDialogOpen(true)}>
        <Settings className='w-4 h-4' />
        <span className='hidden md:block'>表示項目</span>
      </Button>
      <Button variant='outline' size='sm' onClick={() => setCsvExportOpen(true)}>
        <Download className='w-4 h-4' />
        <span className='hidden md:block'>Excel/CSV出力</span>
      </Button>
      <Dialog>
        <DialogTrigger asChild>
          <StandardButton buttonType='create' size='sm'>
            <Plus className='w-4 h-4' />
            <span className='hidden md:block'>勤怠記録作成</span>
          </StandardButton>
        </DialogTrigger>
        <DialogContent className='dialog-scrollbar'>
          <DialogHeader>
            <DialogTitle>勤怠記録作成</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='employee'>メンバー</Label>
              <Combobox
                options={users.map((user) => ({
                  value: user.id,
                  label: user.name,
                  code: user.code,
                }))}
                onValueChange={() => {}}
                placeholder='メンバーを選択'
                emptyText='該当するメンバーがありません'
              />
            </div>
            <div>
              <Label htmlFor='workDate'>勤務日</Label>
              <Input id='workDate' type='date' />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='clockIn'>出勤時刻</Label>
                <Input id='clockIn' type='time' />
              </div>
              <div>
                <Label htmlFor='clockOut'>退勤時刻</Label>
                <Input id='clockOut' type='time' />
              </div>
            </div>
            <div className='flex justify-end space-x-2'>
              <StandardButton buttonType='cancel' variant='outline'>
                キャンセル
              </StandardButton>
              <StandardButton buttonType='save'>作成</StandardButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceHeaderButton;
