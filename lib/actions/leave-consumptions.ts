'use server';

export interface LeaveConsumptionData {
  id: string;
  request_id: string;
  user_id: string;
  leave_type_id: string;
  grant_id: string;
  quantity_minutes: number;
  consumed_on: string | null;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * 休暇申請承認時にleave_consumptionsにデータを作成
 */
export async function createLeaveConsumptionOnApproval(
  requestId: string,
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string; consumptionId?: string }> {
  try {
    console.log('createLeaveConsumptionOnApproval開始:', { requestId, userId, companyId });
    const supabase = createAdminClient();

    // 1. 申請情報を取得
    console.log('申請情報取得開始');
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select(
        `
        id,
        form_data,
        start_date,
        end_date,
        request_forms!inner(
          id,
          category,
          form_config
        )
      `
      )
      .eq('id', requestId)
      .eq('request_forms.category', 'leave')
      .single();

    console.log('申請情報取得結果:', { request, error: requestError });

    if (requestError || !request) {
      return { success: false, error: '申請情報の取得に失敗しました' };
    }

    // 2. 休暇種別を取得（form_dataから）
    const formData = request.form_data as Record<string, any>;
    const leaveType = formData.leave_type;
    console.log('form_dataから取得した休暇種別:', { formData, leaveType });

    if (!leaveType) {
      return { success: false, error: '休暇種別が指定されていません' };
    }

    // 3. leave_typesテーブルから該当する休暇種別のIDを取得（company_idで絞り込む）
    console.log('leave_types取得開始:', { companyId, leaveType });
    const { data: leaveTypeData, error: leaveTypeError } = await supabase
      .from('leave_types')
      .select('id')
      .eq('company_id', companyId)
      .eq('name', leaveType)
      .eq('is_active', true)
      .is('deleted_at', null)
      .maybeSingle();

    console.log('leave_types取得結果:', { leaveTypeData, error: leaveTypeError });

    if (leaveTypeError || !leaveTypeData) {
      return { success: false, error: '休暇種別の取得に失敗しました' };
    }

    // 4. 休暇日数を計算
    const startDate = request.start_date;
    const endDate = request.end_date;

    if (!startDate || !endDate) {
      return { success: false, error: '開始日または終了日が設定されていません' };
    }

    // カレンダー取得はcompany_idが不要な場合はスキップ、必要なら別途取得
    // ここでは単純に日数計算（営業日ロジックは省略）
    const start = new Date(startDate);
    const end = new Date(endDate);
    const workDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalMinutes = workDays * 8 * 60; // 8時間 × 60分

    // 5. 利用可能なleave_grantsを取得（FIFO） company_idで絞り込む
    const { data: availableGrants, error: grantsError } = await supabase
      .from('leave_grants')
      .select('id, quantity_minutes')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('leave_type_id', leaveTypeData.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('granted_on', { ascending: true });

    if (grantsError) {
      return { success: false, error: '休暇付与情報の取得に失敗しました' };
    }

    if (!availableGrants || availableGrants.length === 0) {
      return { success: false, error: '利用可能な休暇付与がありません' };
    }

    // 6. leave_consumptionsにデータを作成 company_idも保存
    const insertData = {
      request_id: requestId,
      user_id: userId,
      company_id: companyId,
      leave_type_id: leaveTypeData.id,
      grant_id: availableGrants[0].id, // 最初の付与を使用
      quantity_minutes: totalMinutes,
      consumed_on: null, // 申請段階ではNULL
      status: 'approved',
      start_date: startDate,
      end_date: endDate,
      created_by: userId,
    };

    console.log('leave_consumptions挿入データ:', insertData);

    const { data: consumption, error: insertError } = await supabase
      .from('leave_consumptions')
      .insert(insertData)
      .select()
      .single();

    console.log('leave_consumptions挿入結果:', { consumption, error: insertError });

    if (insertError) {
      console.error('leave_consumptions作成エラー:', insertError);
      return { success: false, error: '休暇消費データの作成に失敗しました' };
    }

    console.log('leave_consumptions作成完了:', { consumptionId: consumption.id });

    return {
      success: true,
      consumptionId: consumption.id,
    };
  } catch (error) {
    console.error('createLeaveConsumptionOnApprovalエラー:', error);
    return { success: false, error: '予期しないエラーが発生しました' };
  }
}

/**
 * 休暇開始時にステータスを更新
 */
export async function updateLeaveConsumptionStatus(
  consumptionId: string,
  status: 'in_progress' | 'completed' | 'cancelled',
  consumedOn?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed' && consumedOn) {
      updateData.consumed_on = consumedOn;
    }

    const { error } = await supabase
      .from('leave_consumptions')
      .update(updateData)
      .eq('id', consumptionId);

    if (error) {
      console.error('leave_consumptions更新エラー:', error);
      return { success: false, error: 'ステータスの更新に失敗しました' };
    }

    return { success: true };
  } catch (error) {
    console.error('updateLeaveConsumptionStatusエラー:', error);
    return { success: false, error: '予期しないエラーが発生しました' };
  }
}

/**
 * 申請IDからleave_consumptionsを取得
 */
export async function getLeaveConsumptionByRequestId(
  requestId: string
): Promise<{ success: boolean; data?: LeaveConsumptionData; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('leave_consumptions')
      .select('*')
      .eq('request_id', requestId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // データが見つからない場合
        return { success: true, data: undefined };
      }
      return { success: false, error: 'データの取得に失敗しました' };
    }

    return { success: true, data: data as LeaveConsumptionData };
  } catch (error) {
    console.error('getLeaveConsumptionByRequestIdエラー:', error);
    return { success: false, error: '予期しないエラーが発生しました' };
  }
}

/**
 * 休暇申請の取り消し時にleave_consumptionsを削除
 */
export async function deleteLeaveConsumptionOnCancellation(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('leave_consumptions')
      .update({
        deleted_at: new Date().toISOString(),
        status: 'cancelled',
      })
      .eq('request_id', requestId);

    if (error) {
      console.error('leave_consumptions削除エラー:', error);
      return { success: false, error: 'データの削除に失敗しました' };
    }

    return { success: true };
  } catch (error) {
    console.error('deleteLeaveConsumptionOnCancellationエラー:', error);
    return { success: false, error: '予期しないエラーが発生しました' };
  }
}

// ログインユーザーの休暇付与データ取得
export async function getLeaveGrantsByUser(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('leave_grants')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('granted_on', { ascending: false });
  if (error) return [];
  return data || [];
}

// ログインユーザーの休暇消費データ取得
export async function getLeaveConsumptionsByUser(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('leave_consumptions')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

// 会社IDで休暇種別一覧を取得
export async function getLeaveTypes(companyId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('leave_types')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('display_order');
  if (error) return [];
  return data || [];
}
