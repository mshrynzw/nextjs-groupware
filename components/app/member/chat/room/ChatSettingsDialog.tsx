'use client';

import { Minus, Plus, Search, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

import { useData } from '@/contexts/data-context';

interface ChatSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: {
    id: string;
    name?: string;
    chat_type: 'direct' | 'channel';
    is_private: boolean;
    is_edit: boolean;
    is_delete: boolean;
    is_auto_enter: boolean;
    is_auto_exit: boolean;
  };
  onSettingsUpdate: () => void;
}

interface ChatUser {
  user_id: string;
  role: 'admin' | 'member';
  user_profiles: {
    family_name: string;
    first_name: string;
    email: string;
  };
}

interface User {
  id: string;
  family_name: string;
  first_name: string;
  email: string;
  code: string;
}

export default function ChatSettingsDialog({
  open,
  onOpenChange,
  chat,
  onSettingsUpdate,
}: ChatSettingsDialogProps) {
  const { companyId, users } = useData();
  const { toast } = useToast();
  const [channelName, setChannelName] = useState(chat.name || '');
  const [isPrivate, setIsPrivate] = useState(chat.is_private);
  const [isEdit, setIsEdit] = useState(chat.is_edit);
  const [isDelete, setIsDelete] = useState(chat.is_delete);
  const [isAutoEnter, setIsAutoEnter] = useState(chat.is_auto_enter);
  const [isAutoExit, setIsAutoExit] = useState(chat.is_auto_exit);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ChatUser | null>(null);

  // チャット参加者を取得
  useEffect(() => {
    if (!open || !chat.id) return;

    const loadChatUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_users')
          .select(
            `
            user_id,
            role,
            user_profiles!inner(family_name, first_name, email)
          `
          )
          .eq('chat_id', chat.id)
          .is('deleted_at', null);

        if (error) throw error;

        // user_profilesが配列の場合の処理
        const processedData = (data || []).map((item) => ({
          user_id: item.user_id,
          role: item.role,
          user_profiles: Array.isArray(item.user_profiles)
            ? item.user_profiles[0]
            : item.user_profiles,
        }));

        setChatUsers(processedData);
      } catch (error) {
        console.error('Error loading chat users:', error);
      }
    };

    loadChatUsers();
  }, [open, chat.id]);

  // ユーザー検索
  useEffect(() => {
    if (!searchQuery.trim() || !companyId || !Array.isArray(users)) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const delay = 500;

    const timeoutId = setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const filtered = users
        .filter((user) => user.is_active)
        .filter((user) => {
          const fullName = `${user.family_name} ${user.first_name}`.toLowerCase();
          const email = user.email.toLowerCase();
          const code = user.code.toLowerCase();
          return fullName.includes(query) || email.includes(query) || code.includes(query);
        })
        .filter((user) => !chatUsers.some((cu) => cu.user_id === user.id))
        .slice(0, 10);

      setSearchResults(filtered);
      setIsSearching(false);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, companyId, users, chatUsers]);

  // 検索結果をクリアする関数
  const clearSearchResults = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // 設定を更新
  const handleUpdateSettings = async () => {
    if (!chat.id) return;

    // ダイレクトチャットの場合は管理者数の制限チェックをスキップ
    if (chat.chat_type !== 'direct') {
      // 管理者数の制限チェック
      const currentAdmins = chatUsers.filter((cu) => cu.role === 'admin');
      if (currentAdmins.length === 0) {
        toast({
          title: '管理者は最低1人必要です',
          description: '管理者を1人以上設定してください。',
          variant: 'destructive',
        });
        return;
      }

      if (currentAdmins.length > 1) {
        toast({
          title: '管理者は1人のみ設定可能です',
          description: '管理者を1人にしてください。',
          variant: 'destructive',
        });
        return;
      }
    }

    setUpdating(true);
    try {
      // チャンネル名とプライベート設定を更新
      const { error: chatError } = await supabase
        .from('chats')
        .update({
          name: channelName.trim() || null,
          is_private: isPrivate,
          is_edit: isEdit,
          is_delete: isDelete,
          is_auto_enter: isAutoEnter,
          is_auto_exit: isAutoExit,
        })
        .eq('id', chat.id);

      if (chatError) throw chatError;

      onSettingsUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating chat settings:', error);
      toast({
        title: '設定の更新に失敗しました',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  // 参加者を追加
  const handleAddParticipant = async (userId: string) => {
    if (!chat.id) return;

    try {
      console.log('Adding participant:', { chatId: chat.id, userId, role: 'member' });

      // 既に参加しているかチェック（UI側でもチェック済みだが念のため）
      const isAlreadyParticipant = chatUsers.some((cu) => cu.user_id === userId);
      if (isAlreadyParticipant) {
        toast({
          title: 'このユーザーは既にチャットに参加しています。',
          description: 'このユーザーは既にチャットに参加しています。',
          variant: 'default',
        });
        return;
      }

      // データベース側でも重複チェック
      const { data: existingUser, error: checkError } = await supabase
        .from('chat_users')
        .select('id')
        .eq('chat_id', chat.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing user:', checkError);
        throw checkError;
      }

      if (existingUser) {
        toast({
          title: 'このユーザーは既にチャットに参加しています。',
          description: 'このユーザーは既にチャットに参加しています。',
          variant: 'default',
        });
        return;
      }

      const { error } = await supabase.from('chat_users').insert({
        chat_id: chat.id,
        user_id: userId,
        role: 'member',
      });

      if (error) {
        console.error('Supabase error:', error);

        // 重複キーエラーの場合
        if (error.code === '23505') {
          toast({
            title: 'このユーザーは既にチャットに参加しています。',
            description: 'このユーザーは既にチャットに参加しています。',
            variant: 'default',
          });
          return;
        }

        throw error;
      }

      // 参加者リストを再読み込み
      const { data, error: reloadError } = await supabase
        .from('chat_users')
        .select(
          `
          user_id,
          role,
          user_profiles!inner(family_name, first_name, email)
        `
        )
        .eq('chat_id', chat.id)
        .is('deleted_at', null);

      if (reloadError) throw reloadError;

      // user_profilesが配列の場合の処理
      const processedData = (data || []).map((item) => ({
        user_id: item.user_id,
        role: item.role,
        user_profiles: Array.isArray(item.user_profiles)
          ? item.user_profiles[0]
          : item.user_profiles,
      }));

      setChatUsers(processedData);

      // 検索結果をクリア
      clearSearchResults();

      onSettingsUpdate();
    } catch (error) {
      console.error('Error adding participant:', error);
      toast({
        title: '参加者の追加に失敗しました',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  // 参加者を削除
  const handleRemoveParticipant = async (user: ChatUser) => {
    if (!chat.id) return;

    try {
      // 物理削除を行う（deleted_atではなく）
      const { error } = await supabase
        .from('chat_users')
        .delete()
        .eq('chat_id', chat.id)
        .eq('user_id', user.user_id);

      if (error) throw error;

      // 参加者リストを再読み込み
      const { data, error: reloadError } = await supabase
        .from('chat_users')
        .select(
          `
          user_id,
          role,
          user_profiles!inner(family_name, first_name, email)
        `
        )
        .eq('chat_id', chat.id)
        .is('deleted_at', null);

      if (reloadError) throw reloadError;

      // user_profilesが配列の場合の処理
      const processedData = (data || []).map((item) => ({
        user_id: item.user_id,
        role: item.role,
        user_profiles: Array.isArray(item.user_profiles)
          ? item.user_profiles[0]
          : item.user_profiles,
      }));

      setChatUsers(processedData);

      onSettingsUpdate();
    } catch (error) {
      console.error('Error removing participant:', error);
      toast({
        title: '参加者の削除に失敗しました',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  // 参加者のロールを変更
  const handleChangeRole = async (userId: string, newRole: 'admin' | 'member') => {
    if (!chat.id) return;

    try {
      const { error } = await supabase
        .from('chat_users')
        .update({ role: newRole })
        .eq('chat_id', chat.id)
        .eq('user_id', userId);

      if (error) throw error;

      // 参加者リストを再読み込み
      const { data, error: reloadError } = await supabase
        .from('chat_users')
        .select(
          `
          user_id,
          role,
          user_profiles!inner(family_name, first_name, email)
        `
        )
        .eq('chat_id', chat.id)
        .is('deleted_at', null);

      if (reloadError) throw reloadError;

      // user_profilesが配列の場合の処理
      const processedData = (data || []).map((item) => ({
        user_id: item.user_id,
        role: item.role,
        user_profiles: Array.isArray(item.user_profiles)
          ? item.user_profiles[0]
          : item.user_profiles,
      }));

      setChatUsers(processedData);

      onSettingsUpdate();
    } catch (error) {
      console.error('Error changing role:', error);
      toast({
        title: 'ロールの変更に失敗しました',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Settings className='w-5 h-5' />
              チャット設定
            </DialogTitle>
            <DialogDescription>
              {chat.chat_type === 'channel'
                ? 'チャンネルの設定を変更できます'
                : 'ダイレクトチャットの設定を変更できます'}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-6'>
            {/* チャンネル名設定 */}
            {chat.chat_type === 'channel' && (
              <div className='space-y-2'>
                <Label htmlFor='channelName'>チャンネル名</Label>
                <Input
                  id='channelName'
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder='チャンネル名を入力'
                />
              </div>
            )}

            {/* プライベート設定 */}
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <Label>プライベートチャンネル</Label>
                <p className='text-sm text-gray-500'>
                  {isPrivate
                    ? '参加者のみ閲覧・投稿可能'
                    : '全社ユーザーが閲覧可能（投稿は参加者のみ）'}
                </p>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>

            {/* メッセージ設定 */}
            <div className='space-y-1'>
              <Label>メッセージ</Label>
              {/* 編集権限 */}
              <div className='flex items-center justify-between'>
                <p className='text-sm text-gray-500'>編集を許可する</p>
                <Switch
                  checked={isEdit}
                  onCheckedChange={(checked) => {
                    setIsEdit(checked);
                  }}
                />
              </div>
              {/* 削除権限 */}
              <div className='flex items-center justify-between'>
                <p className='text-sm text-gray-500'>削除を許可する</p>
                <Switch
                  checked={isDelete}
                  onCheckedChange={(checked) => {
                    setIsDelete(checked);
                  }}
                />
              </div>
            </div>

            {/* 参加設定 */}
            <div className='space-y-1'>
              <Label>参加</Label>
              {/* 自動参加許可 */}
              <div className='flex items-center justify-between'>
                <p className='text-sm text-gray-500'>自動参加を許可する</p>
                <Switch
                  checked={isAutoEnter}
                  onCheckedChange={(checked) => {
                    setIsAutoEnter(checked);
                  }}
                />
              </div>
              {/* 自動退室許可 */}
              <div className='flex items-center justify-between'>
                <p className='text-sm text-gray-500'>自動退室を許可する</p>
                <Switch
                  checked={isAutoExit}
                  onCheckedChange={(checked) => {
                    setIsAutoExit(checked);
                  }}
                />
              </div>
            </div>

            {/* 参加者管理 - ダイレクトチャットの場合は非表示 */}
            {chat.chat_type !== 'direct' && (
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <Label>参加者管理</Label>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-gray-500'>{chatUsers.length}人</span>
                    <span className='text-sm text-blue-600'>
                      (管理者: {chatUsers.filter((cu) => cu.role === 'admin').length}人)
                    </span>
                  </div>
                </div>

                {/* 参加者追加 */}
                <div className='space-y-2'>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                    <Input
                      placeholder='ユーザーを検索して追加...'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className='pl-10'
                    />
                  </div>

                  {/* 検索結果 */}
                  {searchResults.length > 0 && (
                    <div className='border rounded-md p-2 space-y-2 max-h-40 overflow-y-auto'>
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className='flex items-center justify-between p-2 bg-gray-50 rounded-md'
                        >
                          <div className='flex-1 min-w-0'>
                            <div className='font-medium text-sm truncate'>
                              {user.family_name} {user.first_name}
                            </div>
                            <div className='text-xs text-gray-500 truncate'>{user.email}</div>
                          </div>
                          <Button
                            size='sm'
                            onClick={() => handleAddParticipant(user.id)}
                            className='ml-2'
                          >
                            <Plus className='w-4 h-4' />
                            追加
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 参加者一覧 */}
                <div className='space-y-2'>
                  {chatUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className='flex items-center justify-between p-3 border rounded-md bg-gray-50'
                    >
                      <div className='flex-1 min-w-0'>
                        <div className='font-medium text-sm truncate'>
                          {user.user_profiles.family_name} {user.user_profiles.first_name}
                        </div>
                        <div className='text-xs text-gray-500 truncate'>
                          {user.user_profiles.email}
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Select
                          value={user.role}
                          onValueChange={(value) =>
                            handleChangeRole(user.user_id, value as 'admin' | 'member')
                          }
                        >
                          <SelectTrigger className='w-24'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='member'>メンバー</SelectItem>
                            <SelectItem value='admin'>管理者</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => {
                            setUserToDelete(user);
                            setDeleteConfirmOpen(true);
                          }}
                          className='text-red-600 hover:text-red-700'
                        >
                          <Minus className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* アクションボタン */}
            <div className='flex justify-end space-x-2 pt-4 border-t'>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button
                onClick={handleUpdateSettings}
                disabled={updating}
                className='bg-blue-600 hover:bg-blue-700 text-white'
              >
                {updating ? '更新中...' : '設定を保存'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>参加者を削除</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete && (
                <>
                  <strong>
                    {userToDelete.user_profiles.family_name} {userToDelete.user_profiles.first_name}
                  </strong>
                  をこのチャットから削除しますか？
                </>
              )}
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDelete) {
                  handleRemoveParticipant(userToDelete);
                  setDeleteConfirmOpen(false);
                  setUserToDelete(null);
                }
              }}
              className='bg-red-600 hover:bg-red-700'
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
