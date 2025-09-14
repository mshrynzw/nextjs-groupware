'use client';

import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getChatDetail, getMessages, markAsRead, sendMessage } from '@/lib/actions/chat';
import { getChatSendKeySetting } from '@/lib/actions/user-settings';
import { ChatDetail, ChatMessageData, ChatUser } from '@/schemas/chat';

import InputMessage from '@/components/app/member/chat/ChatFooter';
import ChatHeader from '@/components/app/member/chat/ChatHeader';
import ChatMessages from '@/components/app/member/chat/ChatMessages';
import ChatSettingsDialog from '@/components/app/member/chat/ChatSettingsDialog';
import MessageDeleteDialog from '@/components/app/member/chat/MessageDeleteDialog';
import MessageEditDialog from '@/components/app/member/chat/MessageEditDialog';
// import { useAuth } from '@/contexts/auth-context';

import LoadingSpinner from '@/components/layout/LoadingSpinner';

// チャット参加者型を定義
// ChatUser型はschemas/chat.tsからimportして利用

export default function ChatRoom() {
  const params = useParams();
  const chatId = params.id as string;
  const { user } = useAuth();
  const router = useRouter();
  const [chat, setChat] = useState<ChatDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<ReturnType<
    typeof supabase.channel
  > | null>(null);
  const [chatSendKeyShiftEnter, setChatSendKeyShiftEnter] = useState<boolean>(true);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatMessageData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState<ChatMessageData | null>(null);
  const { toast } = useToast();

  // 機能チェック
  useEffect(() => {
    if (!user?.company_id) {
      router.push('/member/feature-disabled');
      return;
    }
  }, [user?.company_id, router]);

  // チャット詳細とメッセージ読み込み
  useEffect(() => {
    if (!chatId || !user?.id) return;

    const loadChatData = async () => {
      setIsLoading(true);
      try {
        // チャット詳細を取得
        const chatDetail = await getChatDetail(chatId);
        if (chatDetail) {
          setChat(chatDetail);
          setChatUsers(
            chatDetail.participants.map((p) => ({
              id: `${chatId}-${p.user_id}`,
              chat_id: chatId,
              user_id: p.user_id,
              role: p.role,
              last_read_message_id: null, // ここはnullで初期化（必要に応じて値をセット）
              last_read_at: p.last_read_at,
              joined_at: p.joined_at,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              deleted_at: undefined,
              left_at: undefined,
              // user_profilesはChatUser型には存在しないので必要なら別途管理
            }))
          );
        }

        // メッセージを取得
        const messageList = await getMessages(chatId);
        setMessages(messageList);

        // 既読マーク
        const lastMessageId =
          messageList.length > 0 ? messageList[messageList.length - 1].id : null;
        await markAsRead({
          chat_id: chatId,
          user_id: user!.id,
          last_read_message_id: lastMessageId,
        });
      } catch (error) {
        console.error('Error loading chat data:', error);
        toast({
          title: 'エラー',
          description: 'チャット情報の読み込みに失敗しました',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadChatData();
  }, [chatId, user?.id, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user || (user.role !== 'member' && user.role !== 'admin')) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // チャット送信キー設定を読み込み
  useEffect(() => {
    const loadChatSettings = async () => {
      if (!user?.id) return;

      try {
        const setting = await getChatSendKeySetting(user.id);
        setChatSendKeyShiftEnter(setting);
      } catch (error) {
        console.error('Error loading chat settings:', error);
      }
    };

    loadChatSettings();
  }, [user?.id]);

  // リアルタイム機能の初期化
  useEffect(() => {
    if (!user?.id || !chatId) return;

    // 既存のチャンネルをクリーンアップ
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
    }

    // 新しいリアルタイムチャンネルを設定
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          console.log('[Realtime] chat_messages event:', payload);
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as ChatMessageData;

            // 自分のメッセージは除外
            if (newMessage.user_id === user.id) return;

            // 現在のチャットのメッセージの場合のみ追加
            if (newMessage.chat_id === chatId) {
              setMessages((prev) => [...prev, newMessage]);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          console.log('[Realtime] chat_messages UPDATE event:', payload);
          const updatedMessage = payload.new as ChatMessageData;
          if (updatedMessage.chat_id === chatId) {
            setMessages((prev) => {
              const filtered = prev.filter((msg) => msg.id !== updatedMessage.id);
              if (!updatedMessage.deleted_at) {
                return [...filtered, updatedMessage].sort(
                  (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
              }
              return filtered.sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_users',
        },
        (payload: {
          new: {
            chat_id: string;
            user_id: string;
            last_read_message_id: string;
            last_read_at: string;
          };
        }) => {
          console.log('[Realtime] chat_users UPDATE event:', payload);
          const updatedChatUser = payload.new;
          if (updatedChatUser.chat_id === chatId) {
            setChatUsers((prev) =>
              prev.map((cu) =>
                cu.chat_id === updatedChatUser.chat_id && cu.user_id === updatedChatUser.user_id
                  ? {
                      ...cu,
                      last_read_message_id: updatedChatUser.last_read_message_id,
                      last_read_at: updatedChatUser.last_read_at,
                    }
                  : cu
              )
            );
          }
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    // クリーンアップ時は新しく作ったchannelをremove
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, chatId]);

  // スクロール位置自動移動
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    // 自分のlast_read_message_id
    const myChatUser = chatUsers.find((cu) => cu.user_id === user?.id);
    const lastReadId = myChatUser?.last_read_message_id;
    // 1. last_read_message_idのメッセージへ
    if (lastReadId) {
      const idx = messages.findIndex((msg) => msg.id === lastReadId);
      if (idx !== -1) {
        const el = document.getElementById(`msg-${lastReadId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'end' });
          return;
        }
      }
    }
    // 2. 最初の未読メッセージへ
    const firstUnreadIdx = messages.findIndex((msg) => {
      if (!myChatUser?.last_read_message_id) return true;
      return msg.id > myChatUser.last_read_message_id;
    });
    if (firstUnreadIdx !== -1 && firstUnreadIdx < messages.length) {
      const el = document.getElementById(`msg-${messages[firstUnreadIdx].id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'end' });
        return;
      }
    }
    // 3. 最下部
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      return;
    }
    // // 4. 先頭
    // const firstEl = document.getElementById(`msg-${messages[0].id}`);
    // if (firstEl) {
    //   firstEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
    // }
  }, [messages, chatUsers]);

  // 既読マーク: 一番下までスクロールしたら全既読（created_atで判定）
  useEffect(() => {
    if (!messages || messages.length === 0 || !user?.id) return;
    const handleScroll = () => {
      const el = messagesEndRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // 画面下端から20px以内にmessagesEndRefが表示されたら既読
      if (rect.top < window.innerHeight && rect.bottom <= window.innerHeight + 20) {
        const lastMessage = messages[messages.length - 1];
        markAsRead({
          chat_id: chatId,
          user_id: user.id,
          last_read_message_id: lastMessage.id,
          last_read_at: lastMessage.created_at,
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    // 初回も一度判定
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [messages, user?.id, chatId]);

  // タブ復帰時に一番下まで自動スクロール
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const el = messagesEndRef.current;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [messages, user?.id]);

  if (!user || (user.role !== 'member' && user.role !== 'admin')) {
    return null;
  }

  // 機能フラグの読み込み中はローディング表示
  if (!user?.company_id) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto'></div>
          <p className='mt-4 text-gray-600'>機能が無効化されています</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner message='読み込み中...' />;
  }

  if (!chat) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>チャットが見つかりません</h3>
          <p className='text-gray-500 mb-4'>
            指定されたチャットは存在しないか、アクセス権限がありません
          </p>
          <Button onClick={() => router.push('/member/chat')}>
            <ArrowLeft className='w-4 h-4 mr-2' />
            チャット一覧に戻る
          </Button>
        </div>
      </div>
    );
  }

  // 添付ファイル対応: File[]を受け取る
  const handleSendMessage = async (attachments: File[] = []) => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!user?.id) return;
    try {
      const result = await sendMessage({
        chat_id: chatId,
        user_id: user.id,
        content: newMessage,
        message_type: attachments.length > 0 ? 'file' : 'text',
        attachments,
      });
      setMessages((prev) => [...prev, result]);
      setNewMessage('');
      // 送信したメッセージを既読にする
      await markAsRead({
        chat_id: chatId,
        user_id: user.id,
        last_read_message_id: result.id,
        last_read_at: result.created_at,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'エラー',
        description: 'メッセージの送信に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const getChatDisplayName = () => {
    if (chat!.chat_type === 'channel') {
      return chat!.name || 'チャンネルチャット';
    } else {
      // ダイレクトの場合、他の参加者の名前を表示
      if (!chat!.participants || chat!.participants.length === 0) {
        return 'ダイレクト';
      }

      const otherParticipants = chat!.participants
        .filter((p) => p.user_profiles)
        .map((p) => `${p.user_profiles.family_name} ${p.user_profiles.first_name}`)
        .filter((name) => name !== user!.full_name);
      return otherParticipants[0] || 'ダイレクト';
    }
  };

  const getMessageSender = (message: ChatMessageData) => {
    if (message.user_profiles) {
      return {
        id: message.user_id,
        family_name: message.user_profiles.family_name,
        first_name: message.user_profiles.first_name,
      };
    }

    return {
      id: message.user_id,
      family_name: '送信者',
      first_name: '名前',
    };
  };

  // 既読判定（created_atで判定）
  const getReadStatus = (message: ChatMessageData) => {
    // 自分以外の参加者
    const chatParticipants = chatUsers.filter(
      (cu) => cu.chat_id === chatId && cu.user_id !== message.user_id
    );
    if (chatParticipants.length === 0) return '未読';

    // last_read_atがこのメッセージのcreated_at以上なら既読
    const readParticipants = chatParticipants.filter((cu) => {
      if (!cu.last_read_at) return false;
      return new Date(message.created_at) <= new Date(cu.last_read_at);
    });
    if (readParticipants.length === 0) return '未読';

    const readNames = readParticipants
      .map((cu) => {
        // chat.participantsからuser_id一致でuser_profilesを取得
        const participant = chat?.participants.find((p) => p.user_id === cu.user_id);
        return participant
          ? `${participant.user_profiles.family_name} ${participant.user_profiles.first_name}`
          : cu.user_id;
      })
      .join(', ');

    return `既読 ${readParticipants.length}/${chatParticipants.length} ${readNames}`;
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 投稿欄の表示制御
  const isParticipant = chatUsers.some((cu) => cu.user_id === user!.id);
  const canSendMessage = isParticipant || chat!.is_private !== false;

  return (
    <>
      {/* Chat Header */}
      <ChatHeader
        chat={chat}
        chatUsers={chatUsers}
        user={user}
        setSettingsDialogOpen={setSettingsDialogOpen}
        isParticipant={isParticipant}
        chatId={chatId}
        getChatDisplayName={getChatDisplayName}
        router={router}
      />
      {/* Messages */}
      <ChatMessages
        messages={messages}
        user={user}
        chat={chat}
        getMessageSender={getMessageSender}
        getReadStatus={getReadStatus}
        setEditingMessage={setEditingMessage}
        setEditDialogOpen={setEditDialogOpen}
        setDeletingMessage={setDeletingMessage}
        setDeleteDialogOpen={setDeleteDialogOpen}
        setMessages={setMessages}
        messagesEndRef={messagesEndRef}
        formatMessageTime={formatMessageTime}
      />
      {/* Message Input */}
      <InputMessage
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        chatSendKeyShiftEnter={chatSendKeyShiftEnter}
        canSendMessage={canSendMessage}
        chatId={chatId}
        getChatDisplayName={getChatDisplayName}
        isParticipant={isParticipant}
        setChat={setChat}
        setChatUsers={setChatUsers}
        getChatDetail={getChatDetail}
      />
      {/* 設定ダイアログ */}
      <ChatSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        chat={chat!}
        onSettingsUpdate={async () => {
          // チャット詳細を再読み込み
          const updatedChatDetail = await getChatDetail(chatId);
          if (updatedChatDetail) {
            setChat(updatedChatDetail);
          }
        }}
      />
      {/* 編集ダイアログ */}
      {editingMessage && (
        <MessageEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          message={editingMessage}
          onMessageEdited={() => {
            // メッセージ一覧を再読み込み
            getMessages(chatId).then(setMessages);
            setEditingMessage(null);
          }}
        />
      )}
      {/* 消去ダイアログ */}
      {deletingMessage && (
        <MessageDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          message={deletingMessage}
          onMessageDeleted={() => {
            // メッセージ一覧を再読み込み
            getMessages(chatId).then(setMessages);
            setDeletingMessage(null);
          }}
        />
      )}
    </>
  );
}
