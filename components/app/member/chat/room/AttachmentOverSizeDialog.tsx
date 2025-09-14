import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AttachmentOverSizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  oversizedFiles: File[];
}

export default function AttachmentOverSizeDialog({
  open,
  onOpenChange,
  oversizedFiles,
}: AttachmentOverSizeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添付ファイルの上限超過</DialogTitle>
          <DialogDescription>
            {oversizedFiles.map((file, idx) => (
              <div key={idx} className='mt-2'>
                「{file.name}」のファイルサイズは{Math.round(file.size / 1024 / 1024)}MBです。
              </div>
            ))}
            {/* TODO: 最大サイズを設定できるようにする */}
            <div className='mt-2'>50MB以下のファイルを添付してください。</div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
