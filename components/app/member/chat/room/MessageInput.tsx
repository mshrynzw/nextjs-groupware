'use client';

import { Paperclip, Send, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import AttachmentOverSizeDialog from '@/components/app/member/chat/AttachmentOverSizeDialog';

export type Attachment = {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  url?: string;
};

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: () => void;
  chatSendKeyShiftEnter: boolean;
  canSendMessage: boolean;
  attachments: File[];
  setAttachments: (files: File[]) => void;
  onRemoveAttachment?: (idx: number) => void;
}

export default function MessageInput({
  newMessage,
  setNewMessage,
  onSendMessage,
  chatSendKeyShiftEnter,
  canSendMessage,
  attachments,
  setAttachments,
  onRemoveAttachment,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSizeDialog, setShowSizeDialog] = useState(false);
  const [oversizedFiles, setOversizedFiles] = useState<File[]>([]);

  // textareaの高さを自動調整
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (chatSendKeyShiftEnter) {
      // Shift + Enter で送信の場合
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        onSendMessage();
      }
    } else {
      // Enter で送信の場合
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSendMessage();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    // ファイルサイズチェック
    const oversizedFiles: File[] = [];
    const validFiles: File[] = [];

    Array.from(files).forEach((file) => {
      console.log(
        `File: ${file.name}, Size: ${file.size} bytes (${Math.round(file.size / 1024 / 1024)}MB), Limit: ${MAX_FILE_SIZE} bytes (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)`
      );
      if (file.size > MAX_FILE_SIZE) {
        console.log(`File ${file.name} exceeds size limit`);
        oversizedFiles.push(file);
      } else {
        console.log(`File ${file.name} is within size limit`);
        validFiles.push(file);
      }
    });

    // サイズ超過ファイルがある場合は警告ダイアログを表示
    if (oversizedFiles.length > 0) {
      setOversizedFiles(oversizedFiles);
      setShowSizeDialog(true);
    }

    // 有効なファイルのみ追加（既存の添付と重複しないもの）
    const newFiles = validFiles.filter(
      (file) => !attachments.some((f) => f.name === file.name && f.size === file.size)
    );
    setAttachments([...attachments, ...newFiles]);
    e.target.value = '';
  };

  if (!canSendMessage) {
    return null;
  }

  return (
    <div className='p-4 border-t bg-white/70 backdrop-blur-md rounded-b-lg'>
      <div className='flex items-center space-x-2'>
        <Button variant='ghost' size='sm' onClick={() => fileInputRef.current?.click()}>
          <Paperclip className='w-4 h-4' />
        </Button>
        <input
          type='file'
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          multiple
        />
        <div className='flex-1 relative'>
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyPress}
            placeholder='メッセージを入力...'
            className='pr-10 resize-none min-h-[40px] max-h-[120px] overflow-y-auto'
            rows={1}
          />
          {/* 添付ファイルプレビュー */}
          {attachments.length > 0 && (
            <div className='flex flex-wrap gap-2 mt-2'>
              {attachments.map((file, idx) => (
                <div key={idx} className='flex items-center bg-gray-100 rounded px-2 py-1 text-xs'>
                  <span className='mr-1'>{file.name}</span>
                  <span className='text-gray-400'>({Math.round(file.size / 1024)}KB)</span>
                  <button
                    type='button'
                    className='ml-1 text-gray-400 hover:text-red-500'
                    onClick={() => onRemoveAttachment && onRemoveAttachment(idx)}
                  >
                    <X className='w-3 h-3' />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button
          onClick={onSendMessage}
          disabled={!newMessage.trim() && attachments.length === 0}
          className='bg-blue-600 hover:bg-blue-700'
        >
          <Send className='w-4 h-4' />
        </Button>
      </div>

      {/* ファイルサイズ超過ダイアログ */}
      <AttachmentOverSizeDialog
        open={showSizeDialog}
        onOpenChange={setShowSizeDialog}
        oversizedFiles={oversizedFiles}
      />
    </div>
  );
}
