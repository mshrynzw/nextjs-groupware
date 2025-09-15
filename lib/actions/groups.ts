'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/utils/error-handling';
import { Group } from '@/schemas/group';
import { UserGroupWithUsers } from '@/schemas/user_group';
import { UserProfile } from '@/schemas/user_profile';

// Supabase JOINクエリ結果の型定義
type GroupWithUserGroups = {
  id: string;
  name: string;
  code?: string;
  company_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  user_groups: Array<{
    user_profiles: UserProfile;
  }>;
};

export async function getGroupsByCompany(companyId: string): Promise<Group[]> {
  const supabase = await createSupabaseServerClient();
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .is('deleted_at', null);
  if (groupsError) {
    throw AppError.fromSupabaseError(
      'グループ取得でエラーが発生しました（' + groupsError.message + '）'
    );
  }
  return groups;
}

/**
 * 指定した companyId と userId に紐づくグループを取得
 * - 論理削除されていない `user_groups` のみ対象
 * - 論理削除されていない `groups` のみ対象
 */
// export async function getUserGroupsByCompany(
//   companyId: string,
//   userId: string
// ): Promise<UserGroup[]> {
//   const supabase = await createSupabaseServerClient();

//   // まずユーザーが所属するグループID一覧を取得
//   const { data: userGroup, error: userGroupsError } = await supabase
//     .from('user_groups')
//     .select('*')
//     .eq('user_id', userId)
//     .is('deleted_at', null);
//   console.log('userGroupIds', userGroup);
//   console.log('userGroupsIdsError', userGroupsError);
//   if (userGroupsError) {
//     throw AppError.fromSupabaseError(
//       'ユーザーグループ取得でエラーが発生しました（' + userGroupsError.message + '）'
//     );
//   }

//   return userGroup;

// if (!userGroup || userGroup.length === 0) return [];

// const groupIds = userGroup.map((r) => r.group_id);

// // 該当するグループ情報を取得（会社IDでフィルタ）
// const { data: groups, error: groupsError } = await supabase
//   .from('groups')
//   .select('*')
//   .in('id', groupIds)
//   .eq('company_id', companyId)
//   .eq('is_active', true)
//   .is('deleted_at', null);

// if (groupsError) {
//   throw AppError.fromSupabaseError(
//     'グループ取得でエラーが発生しました（' + groupsError.message + '）'
//   );
// }

// return groups;

/**
 * 指定したユーザーが所属するグループとそのグループの全メンバーを取得
 * - 論理削除されていない `user_groups` のみ対象
 * - 論理削除されていない `groups` のみ対象
 * - 各グループの全メンバー情報も含む
 */
export async function getUserGroupsWithMembers(
  companyId: string,
  userId: string
): Promise<UserGroupWithUsers[]> {
  const supabase = await createSupabaseServerClient();

  // ユーザーが所属するグループID一覧を取得
  const { data: userGroups, error: userGroupsError } = await supabase
    .from('user_groups')
    .select('group_id')
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (userGroupsError) {
    throw AppError.fromSupabaseError(
      'ユーザーグループ取得でエラーが発生しました（' + userGroupsError.message + '）'
    );
  }

  if (!userGroups || userGroups.length === 0) return [];

  const groupIds = userGroups.map((ug) => ug.group_id);

  // 各グループの情報とメンバーを取得
  const { data: groupsWithMembers, error: groupsError } = (await supabase
    .from('groups')
    .select(
      `
      *,
      user_groups!inner(
        user_profiles!inner(*)
      )
    `
    )
    .in('id', groupIds)
    .eq('company_id', companyId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .is('user_groups.deleted_at', null)) as {
    data: GroupWithUserGroups[] | null;
    error: Error | null;
  };

  if (groupsError) {
    throw AppError.fromSupabaseError(
      'グループ情報取得でエラーが発生しました（' + groupsError.message + '）'
    );
  }

  // データを整形
  const result: UserGroupWithUsers[] = (groupsWithMembers || []).map((group) => ({
    id: group.id,
    group_id: group.id,
    users: group.user_groups.map((ug) => ug.user_profiles),
    created_at: group.created_at,
    updated_at: group.updated_at,
    deleted_at: group.deleted_at,
  }));

  return result;
}
