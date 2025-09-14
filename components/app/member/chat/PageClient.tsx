'use client';

import { MessageSquare, Plus, Search, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatListView } from '@/schemas/chat';
import { UserProfile } from '@/schemas/user_profile';

interface PageClientProps {
  user: UserProfile;
  chats: ChatListView[];
}

export default function PageClient({ user, chats }: PageClientProps) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  // const [chatAdminStatus, setChatAdminStatus] = useState<Record<string, boolean>>({});
  // const { companyId } = useData();
  // const { toast } = useToast();

  // 機能チェック
  // useEffect(() => {
  //   if (!user) return;
  //   (async () => {
  //     const features = await getCompanyFeaturesByUserId(user.id);
  //     if (features && !features.features.chat) {
  //       router.replace('/member/feature-disabled');
  //     }
  //   })();
  // }, [user, router]);

  // データ読み込み
  // useEffect(() => {
  //   if (!user?.id) return;

  //   async function loadData() {
  //     setIsLoading(true);
  //     try {
  //       const chatList = await getChats(user!.id, user.company_id ?? undefined);
  //       setChats(chatList);
  //     } catch (error) {
  //       console.error('Error loading chats:', error);
  //       setChats([]);
  //       toast({
  //         title: 'エラー',
  //         description: 'チャット一覧の読み込みに失敗しました',
  //         variant: 'destructive',
  //       });
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   }

  //   loadData();
  // }, [user, user.company_id, toast]);

  // 管理者権限をchatsから直接取得（useEffectは不要になった）
  // useEffect(() => {
  //   if (!chats.length) return;

  //   const adminStatus: Record<string, boolean> = {};
  //   chats.forEach((chat) => {
  //     adminStatus[chat.id] = chat.is_admin || false;
  //   });

  //   setChatAdminStatus(adminStatus);
  // }, [chats]);

  // useEffect(() => {
  //   if (!user || (user.role !== 'member' && user.role !== 'admin')) {
  //     router.push('/login');
  //     return;
  //   }
  // }, [user, router]);

  // if (!user || (user.role !== 'member' && user.role !== 'admin')) {
  //   return null;
  // }

  const getChatDisplayName = (chat: ChatListView) => {
    if (chat.chat_type === 'channel') {
      return chat.name || 'チャンネルチャット';
    } else {
      // ダイレクトの場合、他の参加者の名前を表示
      const otherParticipants = chat.participant_names
        .split(', ')
        .filter((name) => name !== user.family_name + ' ' + user.first_name);
      return otherParticipants[0] || 'ダイレクト';
    }
  };

  const formatLastMessageTime = (timestamp: string | null) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handleChatSelect = (chat: ChatListView) => {
    router.push(`/member/chat/${chat.id}`);
  };

  return (
    <div className='h-[calc(100vh-8rem)] flex flex-col bg-white/60 backdrop-blur-md rounded-lg'>
      {/* Header */}
      <div className='p-6 border-b bg-white/70 backdrop-blur-md rounded-t-lg'>
        <div className='flex items-center justify-between mb-6 gap-3 flex-col md:flex-row'>
          <div className='w-full md:w-auto'>
            <h1 className='text-xl md:text-2xl font-bold text-gray-900'>チャット</h1>
            <p className='text-gray-600 mt-1 text-sm md:text-base'>
              社内メンバーとコミュニケーションが取れます
            </p>
          </div>
          <Button
            onClick={() => router.push('/member/chat/create')}
            className='bg-blue-600 hover:bg-blue-700 w-full md:w-auto'
          >
            <Plus className='w-4 h-4 mr-2' />
            <span className='hidden sm:inline'>新規チャット</span>
            <span className='sm:hidden'>新規</span>
          </Button>
        </div>
        <div className='relative w-full md:max-w-md'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
          <Input
            placeholder='チャットを検索...'
            className='pl-10 w-full'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className='flex-1 overflow-y-auto p-6'>
        {chats.length === 0 ? (
          <div className='text-center py-12'>
            <MessageSquare className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>チャットがありません</h3>
            <p className='text-gray-500 mb-4'>新しいチャットを作成して会話を始めましょう</p>
            <Button onClick={() => router.push('/member/chat/new')}>
              <Plus className='w-4 h-4 mr-2' />
              最初のチャットを作成
            </Button>
          </div>
        ) : (
          <div className='grid gap-4 p-2'>
            {chats
              .filter(
                (chat) =>
                  searchQuery === '' ||
                  getChatDisplayName(chat).toLowerCase().includes(searchQuery.toLowerCase()) ||
                  chat.participant_names.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((chat) => (
                <div
                  key={chat.id}
                  className='group p-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl cursor-pointer hover:bg-white/95 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-1 transition-all duration-300 ease-out transform hover:scale-[1.02]'
                  onClick={() => handleChatSelect(chat)}
                >
                  <div className='flex items-center space-x-4'>
                    <div className='relative'>
                      <Avatar className='w-12 h-12 group-hover:scale-110 transition-transform duration-300 ease-out'>
                        <AvatarFallback className='bg-blue-500 text-white text-lg group-hover:bg-blue-600 transition-colors duration-300'>
                          {chat.chat_type === 'channel' ? (
                            <Users className='w-6 h-6' />
                          ) : (
                            getChatDisplayName(chat).charAt(0)
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {chat.chat_type === 'channel' && (
                        <div className='absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white group-hover:scale-110 group-hover:bg-green-400 transition-all duration-300'></div>
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-1'>
                        {/* 左半分: チャット情報 */}
                        <div className='grid grid-rows-2 gap-2 m-2 h-full space-y-2 min-w-0'>
                          {/* 上半分: タグとチャット名 */}
                          <div className='flex flex-col items-start min-w-0'>
                            <div className='flex gap-2 flex-wrap'>
                              {/* 参加状況タグ */}
                              <div
                                className={`px-2 py-1 text-[10px] sm:text-xs font-bold text-white rounded-md transition-all duration-300 flex items-center justify-center whitespace-nowrap ${
                                  chat.is_participant
                                    ? 'bg-blue-500 group-hover:bg-blue-600'
                                    : 'bg-purple-500 group-hover:bg-purple-600'
                                }`}
                              >
                                {chat.is_participant ? '参加' : '閲覧'}
                              </div>
                              {/* プライバシータグ */}
                              <div
                                className={`px-2 py-1 text-[10px] sm:text-xs font-bold text-white rounded-md transition-all duration-300 flex items-center justify-center whitespace-nowrap ${
                                  chat.is_private
                                    ? 'bg-red-500 group-hover:bg-red-600'
                                    : 'bg-green-500 group-hover:bg-green-600'
                                }`}
                              >
                                {chat.is_private ? 'プライベート' : 'パブリック'}
                              </div>
                              {/* 権限タグ - 参加者のみ表示 */}
                              {chat.is_participant && (
                                <div
                                  className={`px-2 py-1 text-[10px] sm:text-xs font-bold text-white rounded-md transition-all duration-300 flex items-center justify-center whitespace-nowrap ${
                                    chat.is_admin
                                      ? 'bg-orange-500 group-hover:bg-orange-600'
                                      : 'bg-yellow-500 group-hover:bg-yellow-600'
                                  }`}
                                >
                                  {chat.is_admin ? '管理者' : 'メンバー'}
                                </div>
                              )}
                            </div>
                            <h3 className='font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors duration-300 w-full'>
                              {getChatDisplayName(chat)}
                            </h3>
                          </div>

                          {/* 下半分: 参加者情報 */}
                          <div className='flex flex-col justify-start min-w-0'>
                            <div className='font-bold text-gray-500 group-hover:text-gray-600 transition-colors duration-300'>
                              参加者
                            </div>
                            <div className='text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-300 min-w-0'>
                              <span className='text-gray-500 group-hover:text-gray-600 transition-colors duration-300 truncate block'>
                                {chat.participant_names}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 右半分: 最新メッセージと情報 */}
                        <div className='w-full min-w-0'>
                          <div className='flex items-start justify-between gap-4'>
                            {/* 最新メッセージ */}
                            <div className='flex flex-col gap-2 flex-1 min-w-0'>
                              <div className='text-sm font-medium text-gray-700'>
                                最新メッセージ
                              </div>
                              <div className='w-full border border-gray-200 rounded-md p-4'>
                                {chat.last_message ? (
                                  <>
                                    <div className='hidden md:flex items-center space-x-2 w-full'>
                                      <Avatar className='w-6 h-6 flex-shrink-0'>
                                        <AvatarFallback className='bg-gray-500 text-white text-xs'>
                                          {chat.last_message.user_profiles?.family_name?.charAt(
                                            0
                                          ) || '?'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className='flex flex-col flex-1 min-w-0'>
                                        <div className='px-3 py-2 rounded-lg bg-blue-400 backdrop-blur-sm text-white border border-blue-500 w-full'>
                                          <div className='text-xs text-white mb-1'>
                                            {chat.last_message.user_profiles?.family_name}{' '}
                                            {chat.last_message.user_profiles?.first_name}
                                          </div>
                                          {!chat.last_message.is_delete ? (
                                            <div className='text-sm break-words'>
                                              <ReactMarkdown>
                                                {chat.last_message.content.length > 100
                                                  ? chat.last_message.content.slice(0, 100) + '...'
                                                  : chat.last_message.content}
                                              </ReactMarkdown>
                                            </div>
                                          ) : (
                                            <div className='text-sm text-gray-400 italic'>
                                              （このメッセージは消去されました。）
                                            </div>
                                          )}
                                          {chat.last_message.source_id &&
                                            !chat.last_message.is_delete && (
                                              <div className='flex justify-end mt-1'>
                                                <span className='text-xs text-gray-300 italic'>
                                                  （編集済み）
                                                </span>
                                              </div>
                                            )}
                                        </div>
                                        <div className='flex flex-col mt-1 space-y-0.5 items-start'>
                                          <span className='text-xs font-bold text-gray-400'>
                                            {new Date(
                                              chat.last_message.created_at
                                            ).toLocaleTimeString('ja-JP', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            })}
                                          </span>
                                          <span className='text-xs text-gray-500'>
                                            {/* 既読ステータスは簡易表示 */}
                                            {chat.unread_count > 0 ? '未読' : '既読'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    {/* Mobile compact latest sender */}
                                    <div className='md:hidden w-full'>
                                      <div className='px-3 py-2 rounded-lg bg-blue-400 backdrop-blur-sm text-white border border-blue-500'>
                                        <div className='text-xs text-white mb-1'>最新投稿者</div>
                                        <div className='text-sm'>
                                          {chat.last_message.user_profiles?.family_name}{' '}
                                          {chat.last_message.user_profiles?.first_name}
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className='text-sm text-gray-400 italic'>
                                    メッセージがありません
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 右側の情報 */}
                            <div className='flex flex-col items-end gap-2'>
                              {/* 最終メッセージ時刻 */}
                              {chat.last_message_at && (
                                <span className='text-sm text-gray-500 group-hover:text-blue-600 transition-colors duration-300'>
                                  {formatLastMessageTime(chat.last_message_at)}
                                </span>
                              )}
                              {/* 未読数 */}
                              {chat.unread_count > 0 && (
                                <div className='inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full group-hover:bg-red-200 group-hover:text-red-900 group-hover:scale-105 transition-all duration-300'>
                                  {chat.unread_count}件の未読メッセージ
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* ホバー時の光沢効果 */}
                  <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out rounded-xl pointer-events-none'></div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
