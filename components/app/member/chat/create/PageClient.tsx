'use client';
import { BadgeCheck, Mail, Minus, Plus, Search, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import BackButton from '@/components/common/BackButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  createChannelChat,
  getChats,
  getOrCreateDirectChat,
  getUserCompanyId,
} from '@/lib/actions/chat';
import { Channel } from '@/schemas/chat';
import { Group } from '@/schemas/group';
import { UserGroupWithMembers } from '@/schemas/user_group';
import { UserProfile } from '@/schemas/user_profile';

interface PageClientProps {
  user: UserProfile;
  users: UserProfile[];
  groups: Group[];
  userGroupsWithMembers: UserGroupWithMembers[];
  channels: Channel[];
}
export default function PageClient({
  user,
  users,
  groups,
  userGroupsWithMembers,
  channels,
}: PageClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [chatType, setChatType] = useState<'direct' | 'channel'>('direct');
  const [channelName, setChannelName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([user?.id || '']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // ユーザーリスト表示用（フィルタリング機能のため）
  const usersWithGroups = users;

  const toggleParticipant = (userId: string) => {
    if (chatType === 'channel') {
      setSelectedParticipants((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    } else {
      setSelectedParticipants([user?.id || '', userId]);
    }
  };

  const addGroupUsers = (groupId: string) => {
    // userGroupsWithMembersから該当グループのメンバーを取得
    const groupData = userGroupsWithMembers.find((ug) => ug.group_id === groupId);
    if (!groupData) {
      console.error('グループが見つかりませんでした:', groupId);
      return;
    }

    const groupUsers = groupData.users;

    setSelectedParticipants((prev) => {
      const set = new Set(prev);
      groupUsers.forEach((u) => set.add(u.id));
      const newArray = Array.from(set);
      return newArray;
    });
  };

  const removeGroupUsers = (groupId: string) => {
    // userGroupsWithMembersから該当グループのメンバーを取得
    const groupData = userGroupsWithMembers.find((ug) => ug.group_id === groupId);
    if (!groupData) return;

    const groupUsers = groupData.users;
    setSelectedParticipants((prev) => prev.filter((id) => !groupUsers.some((u) => u.id === id)));
  };

  const handleCreateChat = async () => {
    if (!user) return;
    setCreating(true);
    try {
      let _chatId = '';
      const effectiveCompanyId = user.company_id || (await getUserCompanyId(user.id));
      if (chatType === 'direct') {
        if (selectedParticipants.length !== 2) {
          toast({
            title: 'ダイレクトには2人の参加者を選択してください',
            variant: 'destructive',
          });
          setCreating(false);
          return;
        }
        _chatId = await getOrCreateDirectChat(
          selectedParticipants[0],
          selectedParticipants[1],
          effectiveCompanyId
        );
      } else {
        if (!channelName.trim()) {
          toast({
            title: 'チャンネル名を入力してください',
            variant: 'destructive',
          });
          setCreating(false);
          return;
        }
        if (selectedParticipants.length === 0) {
          toast({
            title: '参加者を1人以上選択してください',
            variant: 'destructive',
          });
          setCreating(false);
          return;
        }
        _chatId = await createChannelChat({
          company_id: effectiveCompanyId,
          name: channelName,
          chat_type: 'channel',
          participant_ids: [user.id, ...selectedParticipants.filter((id) => id !== user.id)],
          settings: {},
        });
      }
      await getChats(user.id);
      router.replace('/member/chat');
    } catch {
      toast({
        title: 'チャット作成に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  // --- 無効ユーザー除外 ---
  const filteredUsers = useMemo(() => {
    let list = usersWithGroups.filter((u) => u.is_active); // ここで有効ユーザーのみ
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (u) =>
          `${u.family_name} ${u.first_name}`.toLowerCase().includes(q) ||
          `${u.family_name_kana} ${u.first_name_kana}`.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.code.toLowerCase().includes(q) ||
          (u.phone && u.phone.toLowerCase().includes(q))
      );
    }
    if (selectedGroup !== 'all') {
      // userGroupsWithMembersから該当グループのメンバーIDを取得
      const groupData = userGroupsWithMembers.find((ug) => ug.group_id === selectedGroup);
      if (groupData) {
        const groupUserIds = groupData.users.map((u) => u.id);
        list = list.filter((u) => groupUserIds.includes(u.id));
      }
    }
    return list;
  }, [usersWithGroups, searchQuery, selectedGroup, userGroupsWithMembers]);

  const selectedUserObjs = useMemo(() => {
    return usersWithGroups.filter((u) => selectedParticipants.includes(u.id));
  }, [usersWithGroups, selectedParticipants]);

  return (
    <div className='m-4'>
      {/* 最上部: グループ一覧カード */}
      <div className='max-w-full py-6'>
        <Card className='w-full'>
          <CardHeader className='flex flex-row'>
            <BackButton backPath='/member/chat' />
            <CardTitle>チャンネル一覧</CardTitle>
          </CardHeader>
          <CardContent className='py-3 flex flex-wrap gap-2'>
            {channels.length === 0 ? (
              <span className='text-gray-400 text-sm'>チャンネルがありません</span>
            ) : (
              channels.map((c) => (
                <Badge key={c.id} variant='outline' className='text-sm'>
                  {c.name}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      <div className='bg-gradient-to-br from-white via-gray-50 to-blue-50'>
        <div className='flex flex-col md:flex-row'>
          {/* 左カラム: 白背景 */}
          <div className='w-full md:w-96 md:min-w-[320px] md:border-r border-b md:border-b-0 bg-white/90 backdrop-blur-md flex flex-col p-4 md:p-6 space-y-6'>
            {/* チャットタイプ・グループ名 */}
            <Card>
              <CardHeader>
                <CardTitle>チャットタイプ</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={chatType}
                  onValueChange={(v) => setChatType(v as 'direct' | 'channel')}
                  className='flex flex-col space-y-2'
                >
                  <div className='flex items-center'>
                    <RadioGroupItem value='direct' id='direct' />
                    <label htmlFor='direct' className='ml-2'>
                      ダイレクト
                    </label>
                  </div>
                  <div className='flex items-center'>
                    <RadioGroupItem value='channel' id='channel' />
                    <label htmlFor='channel' className='ml-2'>
                      チャンネル
                    </label>
                  </div>
                </RadioGroup>
                {chatType === 'channel' && (
                  <div className='mt-4'>
                    <Input
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder='チャンネル名を入力'
                    />
                  </div>
                )}
              </CardContent>
            </Card>
            {/* グループ一括操作 */}
            {chatType === 'channel' && (
              <Card>
                <CardHeader>
                  <CardTitle>グループ操作</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-col gap-2'>
                    {userGroupsWithMembers.map((groupData) => {
                      const group = groups.find((g) => g.id === groupData.group_id);
                      if (!group) return null;

                      return (
                        <div
                          key={groupData.group_id}
                          className='flex items-center space-x-2 border rounded px-2 py-1 bg-gray-50'
                        >
                          <Users className='w-4 h-4 text-blue-500' />
                          <span className='flex-1 truncate'>{group.name}</span>
                          <span className='text-xs text-gray-500'>
                            ({groupData.users.length}人)
                          </span>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => addGroupUsers(groupData.group_id)}
                            title='グループの全員を追加'
                          >
                            <Plus className='w-4 h-4' />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => removeGroupUsers(groupData.group_id)}
                            title='グループの全員を除外'
                          >
                            <Minus className='w-4 h-4' />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          {/* 右カラム: 灰色背景 */}
          <div className='flex-1 flex flex-col bg-gray-50/90 p-4 md:p-8'>
            {/* フィルタカード */}
            <div className='mb-6'>
              <Card>
                <CardHeader>
                  <CardTitle>フィルター</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-col md:flex-row gap-4'>
                    <div className='relative flex-1'>
                      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                      <Input
                        placeholder='名前、カナ、メール、個人コード、電話番号で検索'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='pl-10 w-full'
                      />
                    </div>
                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                      <SelectTrigger className='w-full md:w-60'>
                        <SelectValue placeholder='グループで絞り込み' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>全てのグループ</SelectItem>
                        {userGroupsWithMembers.map((groupData) => {
                          const group = groups.find((g) => g.id === groupData.group_id);
                          if (!group) return null;
                          return (
                            <SelectItem key={groupData.group_id} value={groupData.group_id}>
                              {group.name} ({groupData.users.length}人)
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* ユーザーリスト */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
              {filteredUsers.length === 0 && (
                <div className='col-span-full text-center py-8 text-gray-500'>
                  条件に一致するユーザーが見つかりません
                </div>
              )}
              {filteredUsers.map((u) => {
                const isSelected = selectedParticipants.includes(u.id);
                return (
                  <Card
                    key={u.id}
                    className={`transition-all border-2 ${isSelected ? 'border-blue-500 bg-blue-50/40' : 'border-gray-200'} shadow-sm hover:shadow-lg cursor-pointer`}
                    tabIndex={0}
                    aria-pressed={isSelected}
                    role='button'
                  >
                    <CardContent className='p-4 flex flex-col gap-0 min-h-0'>
                      <div className='flex items-center gap-2'>
                        <div className='flex-1 min-w-0'>
                          <div className='font-medium truncate text-base flex items-center gap-2'>
                            <div className='w-7 h-7 lg:w-8 lg:h-8 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 flex-shrink-0'>
                              <span className='text-xs font-medium text-black'>
                                {u?.family_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            {u.family_name} {u.first_name}
                          </div>
                          <div className='text-xs text-gray-500 truncate flex items-center gap-1'>
                            <Mail className='w-3 h-3 mr-1' />
                            {u.email}
                          </div>
                        </div>
                      </div>
                      <div className='flex gap-2 mt-1'>
                        <Badge
                          variant={u.role === 'admin' ? 'default' : 'secondary'}
                          className='flex items-center gap-1'
                        >
                          <BadgeCheck className='w-3 h-3' />
                          {u.role === 'admin' ? '管理者' : 'メンバー'}
                        </Badge>
                      </div>
                      <div className='flex flex-wrap gap-1 mt-1 overflow-x-auto'>
                        <Badge key={u.id} variant='outline' className='text-xs whitespace-nowrap'>
                          {u.family_name} {u.first_name}
                        </Badge>
                      </div>

                      <input
                        type='button'
                        onClick={() => toggleParticipant(u.id)}
                        className={`border-2 rounded-md px-2 py-1 mt-2 w-full text-sm font-medium transition-colors duration-150 ${
                          isSelected
                            ? 'text-black-200 border-black-200 bg-black-50/40 cursor-default'
                            : 'text-blue-500 border-blue-500 bg-white hover:bg-blue-50 cursor-pointer'
                        }`}
                        value={
                          chatType === 'direct' && u.id === user.id
                            ? '追加'
                            : isSelected
                              ? '削除'
                              : '追加'
                        }
                        aria-label='参加者に追加'
                        disabled={chatType === 'direct' && u.id === user.id}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {/* 参加者選択状況・作成ボタン */}
            <Card className='mt-6'>
              <CardHeader>
                <CardTitle>選択中の参加者</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='mb-2 text-sm text-gray-600 min-h-[1.5em]'>
                  {selectedUserObjs.length > 0
                    ? selectedUserObjs.map((u) => `${u.family_name} ${u.first_name}`).join(', ')
                    : 'なし'}
                </div>
              </CardContent>
            </Card>
            <Card className='mt-6'>
              <CardHeader>
                {chatType === 'channel' ? (
                  <CardTitle>チャンネル名</CardTitle>
                ) : (
                  <CardTitle>ダイレクト</CardTitle>
                )}
              </CardHeader>
              <CardContent>
                {chatType === 'channel' && (
                  <Input
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder='チャンネル名を入力'
                  />
                )}
                <Button
                  className='w-full mt-2'
                  onClick={() => setConfirmOpen(true)}
                  disabled={creating || (chatType === 'channel' && !channelName.trim())}
                  variant='timeport-primary'
                >
                  確認
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 確認ダイアログ */}
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent className='max-w-md'>
              <DialogHeader>
                <DialogTitle>チャット作成の確認</DialogTitle>
                <DialogDescription>
                  以下の内容でチャットを作成します。よろしいですか？
                </DialogDescription>
              </DialogHeader>
              <div className='p-3 bg-blue-50 rounded-md border border-blue-100'>
                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label className='font-medium'>チャットタイプ</Label>
                      <p className='text-sm text-gray-600'>
                        {chatType === 'direct' ? 'ダイレクト' : 'チャンネル'}
                      </p>
                    </div>
                  </div>
                  {chatType === 'channel' && (
                    <div>
                      <Label className='font-medium'>チャンネル名</Label>
                      <p className='text-sm text-gray-600'>{channelName}</p>
                    </div>
                  )}
                  <div>
                    <Label className='font-medium'>参加者</Label>
                    <p className='text-sm text-gray-600'>
                      {selectedUserObjs.length > 0
                        ? selectedUserObjs.map((u) => `${u.family_name} ${u.first_name}`).join(', ')
                        : 'なし'}
                    </p>
                  </div>
                </div>
                <div className='flex justify-end space-x-2 mt-4'>
                  <Button variant='outline' onClick={() => setConfirmOpen(false)}>
                    キャンセル
                  </Button>
                  <Button
                    variant='timeport-primary'
                    onClick={handleCreateChat}
                    disabled={creating}
                    className='bg-blue-600 hover:bg-blue-700 text-white'
                  >
                    追加
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
