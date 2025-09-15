import React, { useState } from 'react';

import JoinChatButton from '@/components/app/member/chat/detail/JoinChatButton';
import MessageInput from '@/components/app/member/chat/detail/MessageInput';
import type { ChatRoom } from '@/schemas/chat';
import { ChatUser } from '@/schemas/chat';

export default function InputMessage({
  newMessage,
  setNewMessage,
  handleSendMessage,
  chatSendKeyShiftEnter,
  canSendMessage,
  chatId,
  getChatDisplayName,
  isParticipant,
  setChat,
  setChatUsers,
  getChatDetail,
}: {
  newMessage: string;
  setNewMessage: (msg: string) => void;
  handleSendMessage: (attachments?: File[]) => void;
  chatSendKeyShiftEnter: boolean;
  canSendMessage: boolean;
  chatId: string;
  getChatDisplayName: () => string;
  isParticipant: boolean;
  setChat: (chat: ChatRoom) => void;
  setChatUsers: React.Dispatch<React.SetStateAction<ChatUser[]>>;
  getChatDetail: (chatId: string) => Promise<ChatRoom | null>;
}) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleRemoveAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // 送信時にファイルをアップロードし、アップロード後の情報でAPIを呼ぶ
  const handleSend = async () => {
    if (uploading) return;
    setUploading(true);
    try {
      // メッセージ送信API呼び出し（ファイルはAPI内でアップロード）
      handleSendMessage(attachments);
      setAttachments([]);
    } catch (e) {
      alert('メッセージの送信に失敗しました（' + e + '）');
      console.error('メッセージの送信に失敗しました（' + e + '）');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <MessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={handleSend}
        chatSendKeyShiftEnter={chatSendKeyShiftEnter}
        canSendMessage={canSendMessage}
        attachments={attachments}
        setAttachments={setAttachments}
        onRemoveAttachment={handleRemoveAttachment}
      />
      {!canSendMessage && (
        <div className='p-4 border-t bg-white/70 backdrop-blur-md rounded-b-lg flex items-center justify-center'>
          <span className='text-gray-400'>
            このチャンネルのメッセージ送信権限がありません（閲覧のみ可能）
          </span>
          <JoinChatButton
            chatId={chatId}
            chatName={getChatDisplayName()}
            isParticipant={isParticipant}
            onJoinSuccess={async () => {
              // チャット詳細を再読み込み
              const updatedChatDetail = await getChatDetail(chatId);
              if (updatedChatDetail) {
                setChat(updatedChatDetail);
                setChatUsers(
                  updatedChatDetail.participants.map((p) => ({
                    id: `${chatId}-${p.user_id}`,
                    chat_id: chatId,
                    user_id: p.user_id,
                    role: p.role,
                    last_read_message_id: null, // 必要に応じてセット
                    last_read_at: p.last_read_at,
                    joined_at: p.joined_at,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    deleted_at: undefined,
                    left_at: undefined,
                  }))
                );
              }
            }}
          />
        </div>
      )}
    </>
  );
}
