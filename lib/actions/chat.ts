'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  type AddReactionRequest,
  type ChatDetail,
  type ChatListView,
  type ChatMessageData as ChatMessage,
  type ChatMessageReactionData as ChatMessageReaction,
  type CreateChatRequest,
  type MarkAsReadRequest,
  type SendMessageRequest,
} from '@/schemas/chat';

// ================================
// ユーザーの企業ID取得
// ================================

/**
 * ユーザーの企業IDを取得
 */
export async function getUserCompanyId(userId: string): Promise<string> {
  const supabase = await createSupabaseServerClient();

  try {
    // ユーザーのグループを取得
    const { data: userGroupsData, error: userGroupsError } = await supabase
      .from('user_groups')
      .select('group_id')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .limit(1);

    if (userGroupsError || !userGroupsData || userGroupsData.length === 0) {
      console.error('Error fetching user groups:', userGroupsError);
      throw new Error('ユーザーグループの取得に失敗しました');
    }

    // グループから企業IDを取得
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('company_id')
      .eq('id', userGroupsData[0].group_id)
      .single();

    if (groupError || !groupData?.company_id) {
      console.error('Error fetching group:', groupError);
      throw new Error('企業情報の取得に失敗しました');
    }

    return groupData.company_id;
  } catch (error) {
    console.error('Error getting user company ID:', error);
    throw error;
  }
}

// ================================
// ユーザー検索
// ================================

/**
 * ユーザー検索（参加者選択用）
 */
export async function searchUsers(
  query: string,
  currentUserId: string,
  companyId?: string
): Promise<
  Array<{
    id: string;
    code: string;
    family_name: string;
    first_name: string;
    family_name_kana: string;
    first_name_kana: string;
    email: string;
  }>
> {
  if (!query.trim()) {
    return [];
  }
  const supabase = await createSupabaseServerClient();

  try {
    // 1. 検索条件に合うユーザーを取得
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('is_active', true)
      .or(
        `code.ilike.%${query}%,family_name.ilike.%${query}%,first_name.ilike.%${query}%,family_name_kana.ilike.%${query}%,first_name_kana.ilike.%${query}%`
      )
      .limit(20);
    if (usersError) throw usersError;
    if (!users || users.length === 0) return [];

    // 2. 取得したユーザーのIDリスト
    const userIds = users.map((u) => u.id);

    // 3. そのユーザーたちのuser_groupsを取得
    const { data: userGroups, error: userGroupsError } = await supabase
      .from('user_groups')
      .select('user_id, group_id')
      .in('user_id', userIds)
      .is('deleted_at', null);
    if (userGroupsError) throw userGroupsError;
    if (!userGroups || userGroups.length === 0) return [];

    // 4. そのグループのgroupsテーブルからcompany_idを取得
    const groupIds = userGroups.map((ug) => ug.group_id);
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, company_id')
      .in('id', groupIds)
      .is('deleted_at', null);
    if (groupsError) throw groupsError;
    if (!groups || groups.length === 0) return [];

    // 5. 各ユーザーが「同じcompany_idのグループに所属しているか」でフィルタ
    const filteredUsers = users.filter((user) => {
      const userGroup = userGroups.find((ug) => ug.user_id === user.id);
      if (!userGroup) return false;
      const group = groups.find((g) => g.id === userGroup.group_id);
      return group && group.company_id === companyId;
    });

    // 6. 整形して返す
    return filteredUsers.map((user) => ({
      id: user.id,
      code: user.code,
      family_name: user.family_name,
      first_name: user.first_name,
      family_name_kana: user.family_name_kana,
      first_name_kana: user.first_name_kana,
      email: user.email,
    }));
  } catch (error) {
    console.error('Unexpected error in searchUsers:', error);
    throw new Error(
      `予期しないエラー: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ================================
// チャット権限チェック
// ================================

/**
 * ユーザーが指定されたチャットの管理者かどうかをチェック
 */
export async function isChatAdmin(chatId: string, userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  try {
    const { data: chatUser, error } = await supabase
      .from('chat_users')
      .select('role')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !chatUser) {
      return false;
    }

    return chatUser.role === 'admin';
  } catch (error) {
    console.error('Error checking chat admin status:', error);
    return false;
  }
}

// ================================
// チャット管理
// ================================

/**
 * チャット一覧を取得（参加チャット＋同じ会社のパブリックチャンネルも含む）
 */
export async function getChats(userId: string, companyId?: string): Promise<ChatListView[]> {
  const supabase = await createSupabaseServerClient();

  try {
    // 1. 参加しているチャットIDと管理者権限を取得
    const { data: userChats, error: userChatsError } = await supabase
      .from('chat_users')
      .select('chat_id, role')
      .eq('user_id', userId)
      .is('deleted_at', null);
    if (userChatsError) throw userChatsError;
    const chatIds = userChats?.map((uc) => uc.chat_id) || [];

    // 管理者権限をマッピング
    const adminStatus =
      userChats?.reduce(
        (acc, uc) => {
          acc[uc.chat_id] = uc.role === 'admin';
          return acc;
        },
        {} as Record<string, boolean>
      ) || {};

    // 2. 参加チャット＋同じ会社のパブリックチャンネルを取得
    let query = supabase
      .from('chats')
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });
    if (companyId) {
      query = query.or(
        `id.in.(${chatIds.join(',')}),and(company_id.eq.${companyId},is_private.eq.false)`
      );
    } else {
      query = query.in('id', chatIds);
    }
    const { data: chats, error: chatsError } = await query;
    if (chatsError) throw chatsError;

    // 3. 各チャットの参加者情報と未読数を取得
    const chatListViews: ChatListView[] = [];
    for (const chat of chats || []) {
      const { data: participants, error: participantsError } = await supabase
        .from('chat_users')
        .select('user_profiles!inner(family_name, first_name)')
        .eq('chat_id', chat.id)
        .is('deleted_at', null);
      if (participantsError) continue;

      const participantNames =
        participants
          ?.map((p) => {
            const userProfile = Array.isArray(p.user_profiles)
              ? p.user_profiles[0]
              : p.user_profiles;
            return `${userProfile?.family_name || ''} ${userProfile?.first_name || ''}`;
          })
          .join(', ') || '参加者';

      // 未読数取得（新規追加）
      const { data: unreadData } = await supabase
        .from('unread_message_count_view')
        .select('unread_count')
        .eq('chat_id', chat.id)
        .eq('user_id', userId)
        .single();

      const unreadCount = unreadData?.unread_count || 0;

      // 最新メッセージを取得
      const { data: lastMessage } = await supabase
        .from('chat_messages')
        .select(
          `
          id,
          content,
          created_at,
          user_id,
          is_delete,
          source_id,
          user_profiles!inner(family_name, first_name)
        `
        )
        .eq('chat_id', chat.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // 参加状況判定（新規追加）
      const isParticipant = chatIds.includes(chat.id);

      // 管理者権限判定（新規追加）
      const isAdmin = adminStatus[chat.id] || false;

      chatListViews.push({
        ...chat,
        participant_count: participants?.length || 1,
        participant_names: participantNames,
        last_message_at: chat.last_message_at || chat.updated_at,
        unread_count: unreadCount, // 新規追加
        is_participant: isParticipant, // 新規追加
        is_admin: isAdmin, // 新規追加: 管理者権限
        last_message: lastMessage || null, // 新規追加
      });
    }

    // 4. 並び替えロジック（新規追加）
    return chatListViews.sort((a, b) => {
      // 1. 未読がある参加チャット（最終メッセージ時刻の古い順）
      if (a.is_participant && a.unread_count > 0 && b.is_participant && b.unread_count > 0) {
        return (
          new Date(a.last_message_at || a.updated_at).getTime() -
          new Date(b.last_message_at || b.updated_at).getTime()
        );
      }
      if (a.is_participant && a.unread_count > 0) return -1;
      if (b.is_participant && b.unread_count > 0) return 1;

      // 2. 参加チャット（最終メッセージ時刻の新しい順）
      if (a.is_participant && b.is_participant) {
        return (
          new Date(b.last_message_at || b.updated_at).getTime() -
          new Date(a.last_message_at || a.updated_at).getTime()
        );
      }
      if (a.is_participant) return -1;
      if (b.is_participant) return 1;

      // 3. パブリックチャンネル（最終メッセージ時刻の新しい順）
      return (
        new Date(b.last_message_at || b.updated_at).getTime() -
        new Date(a.last_message_at || a.updated_at).getTime()
      );
    });
  } catch (error) {
    console.error('Error in getChats:', error);
    throw new Error('チャット一覧の取得に失敗しました');
  }
}

/**
 * チャット詳細を取得（パブリックチャンネルは誰でも閲覧可）
 */
export async function getChatDetail(chatId: string): Promise<ChatDetail | null> {
  const supabase = await createSupabaseServerClient();
  // チャット情報を取得
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single();
  if (chatError || !chat) {
    console.error('Error fetching chat:', chatError);
    return null;
  }
  // パブリックでない場合は参加者かどうかチェック（省略: UI/ルートで制御推奨）
  // 参加者情報を取得
  const { data: participants, error: participantsError } = await supabase
    .from('chat_users')
    .select(
      'user_id, role, last_read_at, joined_at, user_profiles!inner(family_name, first_name, email)'
    )
    .eq('chat_id', chatId)
    .is('deleted_at', null);
  // 未読メッセージ数を取得
  const { data: unreadCount } = await supabase
    .from('unread_message_count_view')
    .select('unread_count')
    .eq('chat_id', chatId)
    .single();
  // 最新メッセージを取得
  const { data: lastMessage } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return {
    ...chat,
    participants:
      participants?.map((p) => {
        const userProfile = Array.isArray(p.user_profiles) ? p.user_profiles[0] : p.user_profiles;
        return {
          user_id: p.user_id,
          role: p.role,
          last_read_at: p.last_read_at,
          joined_at: p.joined_at,
          user_profiles: userProfile,
        };
      }) || [],
    unread_count: unreadCount?.unread_count || 0,
    last_message: lastMessage || undefined,
  };
}

/**
 * ダイレクトを作成または取得
 */
export async function getOrCreateDirectChat(
  user1Id: string,
  user2Id: string,
  companyId: string
): Promise<string> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc('get_or_create_direct_chat', {
    p_user1_id: user1Id,
    p_user2_id: user2Id,
    p_company_id: companyId,
  });

  if (error) {
    console.error('Error creating direct chat:', error);
    throw new Error('1対1チャットの作成に失敗しました');
  }

  // ダイレクトチャットの参加者全員を管理者に設定
  try {
    const { error: updateError } = await supabase
      .from('chat_users')
      .update({ role: 'admin' })
      .eq('chat_id', data)
      .is('deleted_at', null);

    if (updateError) {
      console.error('Error updating direct chat participants to admin:', updateError);
      // エラーが発生してもチャット作成は成功しているので、警告のみ
      console.warn('Warning: Failed to set all participants as admin for direct chat');
    }
  } catch (updateError) {
    console.error('Error updating direct chat participants to admin:', updateError);
    // エラーが発生してもチャット作成は成功しているので、警告のみ
    console.warn('Warning: Failed to set all participants as admin for direct chat');
  }

  return data;
}

/**
 * 既存のダイレクトチャットの参加者全員を管理者に更新
 */
export async function updateExistingDirectChatAdmins(): Promise<void> {
  const supabase = await createSupabaseServerClient();

  try {
    // まず、ダイレクトチャットのIDを取得
    const { data: directChatIds, error: fetchError } = await supabase
      .from('chats')
      .select('id')
      .eq('chat_type', 'direct')
      .is('deleted_at', null);

    if (fetchError) {
      console.error('Error fetching direct chat IDs:', fetchError);
      throw new Error('ダイレクトチャットIDの取得に失敗しました');
    }

    if (!directChatIds || directChatIds.length === 0) {
      console.log('No existing direct chats found');
      return;
    }

    // ダイレクトチャットの参加者全員のロールを'admin'に更新
    const chatIds = directChatIds.map((chat) => chat.id);
    const { error: updateError } = await supabase
      .from('chat_users')
      .update({ role: 'admin' })
      .in('chat_id', chatIds)
      .is('deleted_at', null);

    if (updateError) {
      console.error('Error updating existing direct chat participants to admin:', updateError);
      throw new Error('既存のダイレクトチャット参加者の管理者設定に失敗しました');
    }

    console.log('Successfully updated existing direct chat participants to admin');
  } catch (error) {
    console.error('Error updating existing direct chat participants to admin:', error);
    throw error;
  }
}

/**
 * チャンネルチャットを作成
 */
export async function createChannelChat(request: CreateChatRequest): Promise<string> {
  const supabase = await createSupabaseServerClient();

  // チャットを作成
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .insert({
      company_id: request.company_id,
      name: request.name,
      chat_type: request.chat_type,
      created_by: request.participant_ids[0], // 最初の参加者を作成者とする
      settings: request.settings || {},
    })
    .select('id')
    .single();

  if (chatError || !chat) {
    console.error('Error creating channel chat:', chatError);
    throw new Error('チャンネルチャットの作成に失敗しました');
  }

  // 参加者を追加
  const uniqueParticipantIds = Array.from(new Set(request.participant_ids));
  const chatUsers = uniqueParticipantIds.map((userId, index) => ({
    chat_id: chat.id,
    user_id: userId,
    role: index === 0 ? 'admin' : 'member', // 最初の参加者を管理者とする
  }));

  const { error: usersError } = await supabase.from('chat_users').insert(chatUsers);

  if (usersError) {
    console.error('Error adding participants:', usersError);
    throw new Error('参加者の追加に失敗しました');
  }

  revalidatePath('/member/chat');
  return chat.id;
}

// ================================
// メッセージ管理
// ================================

/**
 * メッセージ一覧を取得
 */
export async function getMessages(
  chatId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ChatMessage[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select(
      `
      *,
      user_profiles!inner(
        family_name,
        first_name,
        email
      )
    `
    )
    .eq('chat_id', chatId)
    .is('deleted_at', null) // 編集元メッセージ（deleted_atが設定されている）を除外
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching messages:', error);
    throw new Error('メッセージの取得に失敗しました');
  }

  return (data || []).reverse(); // 古い順に並び替え
}

/**
 * メッセージを送信
 */
export async function sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
  const supabase = await createSupabaseServerClient();

  // リクエストからユーザーIDを取得
  if (!request.user_id) {
    throw new Error('ユーザーIDが指定されていません');
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      chat_id: request.chat_id,
      user_id: request.user_id,
      message_type: request.message_type || 'text',
      content: request.content,
      attachments: request.attachments || [],
      reply_to_message_id: request.reply_to_message_id,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Error sending message:', error);
    throw new Error('メッセージの送信に失敗しました');
  }

  revalidatePath('/member/chat');
  return data;
}

/**
 * メッセージを編集
 */
export async function editMessage(
  messageId: string,
  content: string,
  userId: string
): Promise<ChatMessage> {
  const supabase = await createSupabaseServerClient();

  // 元のメッセージを取得
  const { data: originalMessage, error: fetchError } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('id', messageId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !originalMessage) {
    console.error('Error fetching original message:', fetchError);
    throw new Error('元のメッセージが見つかりません');
  }

  // チャットの編集権限をチェック
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('is_edit')
    .eq('id', originalMessage.chat_id)
    .single();

  if (chatError || !chat) {
    console.error('Error fetching chat:', chatError);
    throw new Error('チャット情報の取得に失敗しました');
  }

  if (!chat.is_edit) {
    throw new Error('このチャットではメッセージの編集が許可されていません');
  }

  // 編集元メッセージのIDを取得（最初の編集元メッセージを保持）
  let sourceMessageId = messageId;
  if (originalMessage.source_id) {
    // 既に編集されたメッセージの場合、最初の編集元メッセージのIDを使用
    sourceMessageId = originalMessage.source_id;
  }

  // 元のメッセージを論理削除
  const { error: deleteError } = await supabase
    .from('chat_messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId);

  if (deleteError) {
    console.error('Error marking original message as deleted:', deleteError);
    throw new Error('元のメッセージの削除に失敗しました');
  }

  // 新しいメッセージを挿入（編集されたメッセージ）
  const { data: newMessage, error: insertError } = await supabase
    .from('chat_messages')
    .insert({
      chat_id: originalMessage.chat_id,
      user_id: userId,
      message_type: originalMessage.message_type,
      content: content,
      attachments: originalMessage.attachments,
      reply_to_message_id: originalMessage.reply_to_message_id,
      source_id: sourceMessageId, // 最初の編集元メッセージのIDを保持
      edited_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (insertError || !newMessage) {
    console.error('Error inserting edited message:', insertError);
    throw new Error('編集されたメッセージの保存に失敗しました');
  }

  revalidatePath('/member/chat');
  return newMessage;
}

/**
 * メッセージを削除
 */
export async function deleteMessage(messageId: string, userId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  // 元のメッセージを取得
  const { data: originalMessage, error: fetchError } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('id', messageId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !originalMessage) {
    console.error('Error fetching original message:', fetchError);
    throw new Error('元のメッセージが見つかりません');
  }

  // チャットの削除権限をチェック
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('is_delete')
    .eq('id', originalMessage.chat_id)
    .single();

  if (chatError || !chat) {
    console.error('Error fetching chat:', chatError);
    throw new Error('チャット情報の取得に失敗しました');
  }

  if (!chat.is_delete) {
    throw new Error('このチャットではメッセージの削除が許可されていません');
  }

  // メッセージを論理削除
  const { error } = await supabase
    .from('chat_messages')
    .update({
      is_delete: true,
    })
    .eq('id', messageId)
    .eq('user_id', userId); // 自分のメッセージのみ削除可能

  if (error) {
    console.error('Error deleting message:', error);
    throw new Error('メッセージの削除に失敗しました');
  }

  revalidatePath('/member/chat');
}

// ================================
// 既読管理
// ================================

/**
 * 既読を更新
 */
export async function markAsRead(request: MarkAsReadRequest): Promise<void> {
  const supabase = await createSupabaseServerClient();

  console.log('markAsRead called with:', request);

  // バリデーション
  if (!request.chat_id) {
    throw new Error('チャットIDが指定されていません');
  }

  // ユーザーIDを直接受け取るように変更
  if (!request.user_id) {
    throw new Error('ユーザーIDが指定されていません');
  }

  const { data, error } = await supabase
    .from('chat_users')
    .update({
      last_read_at: request.last_read_at || new Date().toISOString(),
      last_read_message_id: request.last_read_message_id ?? null,
    })
    .eq('chat_id', request.chat_id)
    .eq('user_id', request.user_id)
    .select();

  if (error) {
    console.error('Error marking as read:', error);
    throw new Error('既読の更新に失敗しました');
  }

  console.log('markAsRead success:', data);
  revalidatePath('/member/chat');
}

// ================================
// リアクション管理
// ================================

/**
 * リアクションを追加
 */
export async function addReaction(request: AddReactionRequest): Promise<ChatMessageReaction> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('chat_message_reactions')
    .insert({
      message_id: request.message_id,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      reaction_type: request.reaction_type,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Error adding reaction:', error);
    throw new Error('リアクションの追加に失敗しました');
  }

  revalidatePath('/member/chat');
  return data;
}

/**
 * リアクションを削除
 */
export async function removeReaction(messageId: string, reactionType: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('chat_message_reactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('message_id', messageId)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .eq('reaction_type', reactionType);

  if (error) {
    console.error('Error removing reaction:', error);
    throw new Error('リアクションの削除に失敗しました');
  }

  revalidatePath('/member/chat');
}

// ================================
// 参加者管理
// ================================

/**
 * 指定した companyId のチャンネルチャットを取得
 * - chat_type == 'channel' のみ対象
 * - 論理削除されていないチャットのみ対象
 */
export async function getChannelsByCompany(companyId: string): Promise<
  Array<{
    id: string;
    name: string;
    is_private: boolean;
    created_at: string;
  }>
> {
  const supabase = await createSupabaseServerClient();

  try {
    const { data: channels, error } = await supabase
      .from('chats')
      .select('id, name, is_private, created_at')
      .eq('company_id', companyId)
      .eq('chat_type', 'channel')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching channels:', error);
      throw new Error('チャンネルの取得に失敗しました');
    }

    return channels || [];
  } catch (error) {
    console.error('Error in getChannelsByCompany:', error);
    throw new Error('チャンネル一覧の取得に失敗しました');
  }
}

/**
 * チャットに参加者を追加
 */
export async function addChatParticipant(
  chatId: string,
  userId: string,
  role: 'admin' | 'member' = 'member'
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from('chat_users').insert({
    chat_id: chatId,
    user_id: userId,
    role,
  });

  if (error) {
    console.error('Error adding participant:', error);
    throw new Error('参加者の追加に失敗しました');
  }

  revalidatePath('/member/chat');
}

/**
 * チャットから参加者を削除
 */
export async function removeChatParticipant(chatId: string, userId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('chat_users')
    .update({ left_at: new Date().toISOString() })
    .eq('chat_id', chatId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing participant:', error);
    throw new Error('参加者の削除に失敗しました');
  }

  revalidatePath('/member/chat');
}

/**
 * 参加者のロールを変更
 */
export async function updateChatParticipantRole(
  chatId: string,
  userId: string,
  role: 'admin' | 'member'
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('chat_users')
    .update({ role })
    .eq('chat_id', chatId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating participant role:', error);
    throw new Error('参加者ロールの更新に失敗しました');
  }

  revalidatePath('/member/chat');
}
