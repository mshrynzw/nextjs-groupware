'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getRoleStatsWithSQL() {
  const supabase = await createSupabaseServerClient();

  try {
    // SQLで直接集計
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .is('deleted_at', null);

    if (error) {
      throw new Error('ロール統計の取得に失敗しました');
    }

    // より詳細な集計
    const stats = {
      systemAdmin: data.filter((user) => user.role === 'system-admin').length,
      admin: data.filter((user) => user.role === 'admin').length,
      member: data.filter((user) => user.role === 'member').length,
      total: data.length,
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('Error in getRoleStatsWithSQL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
