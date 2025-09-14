import { Download, SquarePen, Trash2 } from 'lucide-react';
import React from 'react';

import GoodButton from '@/components/app/member/chat/detail/GoodButton';
import GoodUsersDisplay from '@/components/app/member/chat/detail/GoodUsersDisplay';
import MessageCopyButton from '@/components/app/member/chat/detail/MessageCopyButton';
import MessageMarkdown from '@/components/app/member/chat/detail/MessageMarkdown';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChatDetail, ChatMessageData } from '@/schemas/chat';
// import LinkkButton from '@/components/app/member/chat/detail/detailLinkkButton';
import '@/styles/github-markdown.css';

export default function ChatMessages({
  messages,
  user,
  chat,
  getMessageSender,
  getReadStatus,
  setEditingMessage,
  setEditDialogOpen,
  setDeletingMessage,
  setDeleteDialogOpen,
  setMessages,
  messagesEndRef,
  formatMessageTime,
}: {
  messages: ChatMessageData[];
  user: { id: string };
  chat: ChatDetail;
  getMessageSender: (message: ChatMessageData) => {
    id: string;
    family_name: string;
    first_name: string;
  };
  getReadStatus: (message: ChatMessageData) => string;
  setEditingMessage: (msg: ChatMessageData) => void;
  setEditDialogOpen: (open: boolean) => void;
  setDeletingMessage: (msg: ChatMessageData) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageData[]>>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  formatMessageTime: (timestamp: string) => string;
}) {
  return (
    <div className='flex-1 overflow-y-auto p-4 space-y-4'>
      {messages.length === 0 ? (
        <div className='text-center text-gray-500 mt-8'>メッセージがありません</div>
      ) : (
        messages.map((message) => {
          const sender = getMessageSender(message);
          const isOwnMessage = message.user_id === user.id;
          const readStatus = getReadStatus(message);

          return (
            <div
              key={message.id}
              id={`msg-${message.id}`}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-end space-x-2 max-w-[90%] ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                {!isOwnMessage && (
                  <Avatar className='w-6 h-6 self-start'>
                    <AvatarFallback className='bg-gray-500 text-white text-xs'>
                      {sender?.family_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className='flex flex-col'>
                  <div
                    className={`px-2 py-4 rounded-md shadow-lg shadow-blue-100/50 ${
                      isOwnMessage
                        ? 'backdrop-blur-sm border-blue-200 border-2'
                        : ' backdrop-blur-sm border-blue-400 border-2'
                    }`}
                  >
                    {!isOwnMessage && (
                      <div className='mb-1 text-xs text-gray-700'>
                        {sender?.family_name} {sender?.first_name}
                      </div>
                    )}
                    {/* 消去済みメッセージの場合は内容を非表示 */}
                    {!message.is_delete ? (
                      <div className='bg-white markdown-body'>
                        <MessageMarkdown content={message.content} />
                      </div>
                    ) : (
                      <div className='text-sm text-gray-400 italic'>
                        （このメッセージは消去されました。）
                      </div>
                    )}
                    {/* 編集済み表示 */}
                    {message.source_id && !message.is_delete && (
                      <div className='flex justify-end mt-1'>
                        <span className='text-xs text-gray-300 italic'>（編集済み）</span>
                      </div>
                    )}
                  </div>
                  {/* 添付ファイルがあった場合、ダウンロードリンクを表示する */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className='mt-2 space-y-1'>
                      {message.attachments.map((attachment, idx) => (
                        <div
                          key={attachment.id || idx}
                          className='flex items-center space-x-2 text-xs'
                        >
                          <span className='justify-end text-xs font-bold text-gray-500'>
                            <Download className='w-3 h-3' />
                          </span>
                          <a
                            href={`/api/chat/download/${attachment.id}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-blue-600 hover:text-blue-800 underline justify-end'
                          >
                            {attachment.file_name}
                          </a>
                          <span className='text-gray-400 text-xs'>
                            ({Math.round(attachment.file_size / 1024)}KB)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* 日時と既読ステータス */}
                  <div
                    className={`flex flex-col mt-1 space-y-0.5 ${isOwnMessage ? 'items-end' : 'items-start'}`}
                  >
                    <span
                      className={`text-xs font-bold ${isOwnMessage ? 'text-gray-500' : 'text-gray-400'}`}
                    >
                      {/* リンクアイコン */}
                      {/* <LinkkButton fragment={`msg-${message.id}`} /> */}
                      {/* コピーアイコン - 削除済みメッセージ以外に表示 */}
                      {!message.is_delete && (
                        <MessageCopyButton messageContent={message.content} className='ml-1' />
                      )}
                      {/* 編集アイコン - 自分のメッセージで編集権限がある場合のみ表示 */}
                      {isOwnMessage && chat!.is_edit && !message.is_delete && (
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-6 w-6 p-0 hover:bg-gray-100'
                          onClick={() => {
                            setEditingMessage(message);
                            setEditDialogOpen(true);
                          }}
                          title='メッセージを編集'
                        >
                          <SquarePen className='w-3 h-3' strokeWidth={3} />
                        </Button>
                      )}
                      {/* 消去アイコン - 自分のメッセージで消去権限がある場合のみ表示 */}
                      {isOwnMessage && chat!.is_delete && !message.is_delete && (
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-6 w-6 p-0 hover:bg-gray-100 ml-1'
                          onClick={() => {
                            setDeletingMessage(message);
                            setDeleteDialogOpen(true);
                          }}
                          title='メッセージを消去'
                        >
                          <Trash2 className='w-3 h-3' />
                        </Button>
                      )}
                      {formatMessageTime(message.created_at)}
                    </span>
                    {/* Goodアイコン */}
                    <div className='flex items-center'>
                      <GoodButton
                        message={message}
                        isOwnMessage={isOwnMessage}
                        onGoodUpdate={(messageId, goodUserIds) => {
                          // メッセージのいいね状態を更新
                          setMessages((prev) =>
                            prev.map((msg) =>
                              msg.id === messageId ? { ...msg, good_user_ids: goodUserIds } : msg
                            )
                          );
                        }}
                      />
                      <GoodUsersDisplay message={message} />
                    </div>
                    {/* )} */}
                    <span className='text-xs text-gray-500'>{readStatus}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
