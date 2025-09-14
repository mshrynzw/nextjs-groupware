import { Settings, Download, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

const AttendanceHeaderButton = ({
  handleResetFilters,
  setIsColumnSettingsDialogOpen,
  setCsvExportOpen,
}: {
  handleResetFilters: () => void;
  setIsColumnSettingsDialogOpen: (open: boolean) => void;
  setCsvExportOpen: (open: boolean) => void;
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
        <span className='hidden md:block'>CSV出力</span>
      </Button>
    </div>
  );
};

export default AttendanceHeaderButton;
