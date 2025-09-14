'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getOrganizationStats() {
  const supabase = await createSupabaseServerClient();

  try {
    // 会社情報とグループ数、従業員数を取得
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(
        `
        id,
        name,
        is_active,
        created_at,
        groups!inner(
          id,
          is_active
        ),
        user_profiles!inner(
          id,
          is_active
        )
      `
      )
      .is('deleted_at', null);

    if (companiesError) {
      console.error('Error fetching companies:', companiesError);
      throw new Error('組織統計の取得に失敗しました');
    }

    // データを整形
    const organizationStats = companies.map((company) => {
      // アクティブなグループ数を計算
      const activeGroups = company.groups?.filter((group) => group.is_active) || [];

      // アクティブな従業員数を計算
      const activeEmployees = company.user_profiles?.filter((user) => user.is_active) || [];

      return {
        id: company.id,
        name: company.name,
        groupCount: activeGroups.length,
        employeeCount: activeEmployees.length,
        status: company.is_active ? 'アクティブ' : '非アクティブ',
        isActive: company.is_active,
        createdAt: company.created_at,
      };
    });

    return {
      success: true,
      data: organizationStats,
    };
  } catch (error) {
    console.error('Error in getOrganizationStats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
