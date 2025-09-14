'use server';

/**
 * 現在のユーザーの会社IDを取得
 */
export async function getCurrentUserCompanyId(userId: string): Promise<string | null> {
  const supabase = createAdminClient();

  try {
    // ユーザープロフィールから会社IDを取得
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('current_work_type_id, employment_type_id')
      .eq('id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (profileError) {
      console.error('ユーザープロフィール取得エラー:', profileError);
      return null;
    }

    if (!userProfile) {
      console.log('ユーザープロフィールが見つかりません');
      return null;
    }

    // 勤務形態から会社IDを取得
    if (userProfile.current_work_type_id) {
      const { data: workType, error: workTypeError } = await supabase
        .from('work_types')
        .select('company_id')
        .eq('id', userProfile.current_work_type_id)
        .is('deleted_at', null)
        .maybeSingle();

      if (!workTypeError && workType?.company_id) {
        return workType.company_id;
      }
    }

    // 雇用形態から会社IDを取得
    if (userProfile.employment_type_id) {
      const { data: employmentType, error: employmentError } = await supabase
        .from('employment_types')
        .select('company_id')
        .eq('id', userProfile.employment_type_id)
        .is('deleted_at', null)
        .maybeSingle();

      if (!employmentError && employmentType?.company_id) {
        return employmentType.company_id;
      }
    }

    // グループから会社IDを取得
    const { data: userGroup, error: groupError } = await supabase
      .from('user_groups')
      .select('groups!inner(company_id)')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (!groupError && userGroup?.groups) {
      const groups = userGroup.groups as unknown as { company_id: string };
      if (groups.company_id) {
        return groups.company_id;
      }
    }

    console.log('会社IDが見つかりません');
    return null;
  } catch (error) {
    console.error('会社ID取得エラー:', error);
    return null;
  }
}
