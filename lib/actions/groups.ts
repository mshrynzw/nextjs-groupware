'use server';

export type SimpleGroup = {
  id: string;
  name: string;
  code: string | null;
  company_id: string;
  is_active: boolean;
};

/**
 * 指定した companyId と userId に紐づくグループを取得
 * - 論理削除されていない `user_groups` のみ対象
 * - 論理削除されていない `groups` のみ対象
 */
export async function getGroupsByCompanyAndUser(
  companyId: string,
  userId: string
): Promise<SimpleGroup[]> {
  const supabase = createServerClient();

  // まずユーザーが所属するグループID一覧を取得
  const { data: userGroupRows, error: userGroupsError } = await supabase
    .from('user_groups')
    .select('group_id')
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (userGroupsError) {
    console.error('getGroupsByCompanyAndUser: user_groups error', userGroupsError);
    return [];
  }
  if (!userGroupRows || userGroupRows.length === 0) return [];

  const groupIds = userGroupRows.map((r) => r.group_id);

  // 該当するグループ情報を取得（会社IDでフィルタ）
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('id, name, code, company_id, is_active')
    .in('id', groupIds)
    .eq('company_id', companyId)
    .is('deleted_at', null);

  if (groupsError) {
    console.error('getGroupsByCompanyAndUser: groups error', groupsError);
    return [];
  }

  return (groups || []) as SimpleGroup[];
}
