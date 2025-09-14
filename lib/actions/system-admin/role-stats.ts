'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getRoleStats() {
  const supabase = await createSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .is('deleted_at', null);

    if (error) {
      console.error('Error fetching role stats:', error);
      throw new Error('ロール統計の取得に失敗しました');
    }

    // ロール別の人数を集計
    const roleCounts = data.reduce(
      (acc, user) => {
        const role = user.role;
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      success: true,
      data: {
        systemAdmin: roleCounts['system-admin'] || 0,
        admin: roleCounts['admin'] || 0,
        member: roleCounts['member'] || 0,
        total: data.length,
      },
    };
  } catch (error) {
    console.error('Error in getRoleStats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
