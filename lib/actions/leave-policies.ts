'use server';

import type { BaseDaysByService } from '@/schemas/leave';
import type { FormFieldConfig } from '@/schemas/request';

// 会社のleave_typesを取得
export async function getCompanyLeaveTypes(companyId: string) {
  try {
    const supabase = createAdminClient();
    const { data: leaveTypes, error } = await supabase
      .from('leave_types')
      .select('id, name, description, is_active')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('leave_types取得エラー:', error);
      throw error;
    }

    return { leaveTypes: leaveTypes || [], error: null };
  } catch (error) {
    console.error('leave_types取得エラー:', error);
    return { leaveTypes: [], error: error as Error };
  }
}

// 選択されたleave_typeに基づいてleave_policiesを取得
export async function getLeavePoliciesByType(companyId: string, leaveTypeId: string) {
  try {
    console.log('getLeavePoliciesByType開始:', { companyId, leaveTypeId });

    const supabase = createAdminClient();

    // まず、leave_typesテーブルで指定されたIDが存在するかチェック
    const { data: leaveType, error: leaveTypeError } = await supabase
      .from('leave_types')
      .select('id, name, description')
      .eq('id', leaveTypeId)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .maybeSingle();

    if (leaveTypeError) {
      console.error('leave_type確認エラー:', leaveTypeError);
      throw leaveTypeError;
    }

    if (!leaveType) {
      console.log('指定されたleave_typeが見つかりません:', leaveTypeId);
      return { policies: [], error: null };
    }

    console.log('leave_type確認完了:', leaveType);

    // データベースのテーブル構造を確認
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .from('leave_policies')
        .select('*')
        .limit(1);

      if (tableError) {
        console.error('leave_policiesテーブル構造確認エラー:', tableError);
      } else {
        console.log('leave_policiesテーブル構造:', Object.keys(tableInfo?.[0] || {}));
      }
    } catch (tableCheckError) {
      console.error('テーブル構造確認エラー:', tableCheckError);
    }

    // leave_policiesテーブルからポリシーを取得（より安全なクエリ）
    const policiesQuery = supabase
      .from('leave_policies')
      .select('*')
      .eq('company_id', companyId)
      .eq('leave_type_id', leaveTypeId)
      .eq('is_active', true);

    // deleted_atフィールドが存在する場合のみフィルタを追加
    try {
      const { data: policies, error } = await policiesQuery.is('deleted_at', null);

      if (error) {
        console.error('leave_policies取得エラー:', error);
        // エラーの詳細をログに出力
        console.error('エラー詳細:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      console.log('leave_policies取得完了:', { policies: policies || [] });
      return { policies: policies || [], error: null };
    } catch (queryError) {
      console.error('leave_policiesクエリエラー:', queryError);

      // deleted_atフィールドが存在しない場合は、そのフィルタを除外して再試行
      try {
        const { data: policies, error: retryError } = await supabase
          .from('leave_policies')
          .select('*')
          .eq('company_id', companyId)
          .eq('leave_type_id', leaveTypeId)
          .eq('is_active', true);

        if (retryError) {
          console.error('leave_policies再試行エラー:', retryError);
          throw retryError;
        }

        console.log('leave_policies再試行成功:', { policies: policies || [] });
        return { policies: policies || [], error: null };
      } catch (retryQueryError) {
        console.error('leave_policies再試行クエリエラー:', retryQueryError);
        throw retryQueryError;
      }
    }
  } catch (error) {
    console.error('getLeavePoliciesByTypeエラー:', error);
    return { policies: [], error: error as Error };
  }
}

export interface LeavePolicyInfo {
  id: string;
  company_id: string;
  leave_type_id: string;
  accrual_method: 'anniversary' | 'fiscal_fixed' | 'monthly';
  base_days_by_service: Record<string, number>;
  carryover_max_days: number | null;
  expire_months: number | null;
  allow_negative: boolean;
  hold_on_apply: boolean;
  deduction_timing: 'apply' | 'approve';
  business_day_only: boolean;
  blackout_dates: unknown[];
  day_hours: number;
  min_booking_unit_minutes: number;
  rounding_minutes: number;
  allowed_units: string[];
  half_day_mode: 'fixed_hours' | 'am_pm';
  allow_multi_day: boolean;
}

export interface LeaveTypeInfo {
  id: string;
  company_id: string;
  code: string;
  name: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 指定された会社の有給休暇ポリシーと種別情報を取得
 */
export async function getPaidLeavePolicyInfo(companyId: string): Promise<{
  policy: LeavePolicyInfo | null;
  leaveType: LeaveTypeInfo | null;
}> {
  try {
    const supabase = createAdminClient();

    // 有給休暇タイプを取得
    const { data: leaveTypeData, error: leaveTypeError } = await supabase
      .from('leave_types')
      .select('id, name, description')
      .eq('company_id', companyId)
      .eq('name', '有給休暇')
      .eq('is_active', true)
      .is('deleted_at', null)
      .maybeSingle();

    if (leaveTypeError) {
      console.error('leave_type取得エラー:', leaveTypeError);
      throw leaveTypeError;
    }

    if (!leaveTypeData) {
      console.log('有給休暇タイプが見つかりません');
      return { policy: null, leaveType: null };
    }

    // LeaveTypeInfoの型に合わせてデータを構築
    const leaveType: LeaveTypeInfo = {
      id: leaveTypeData.id,
      company_id: companyId,
      code: 'paid_leave',
      name: leaveTypeData.name,
      description: leaveTypeData.description,
      color: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (leaveTypeError) {
      console.error('leave_type取得エラー:', leaveTypeError);
      throw leaveTypeError;
    }

    if (!leaveType) {
      console.log('有給休暇タイプが見つかりません');
      return { policy: null, leaveType: null };
    }

    // 有給休暇ポリシーを取得
    const { data: policy, error: policyError } = await supabase
      .from('leave_policies')
      .select('*')
      .eq('company_id', companyId)
      .eq('leave_type_id', leaveType.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .maybeSingle();

    if (policyError) {
      console.error('leave_policy取得エラー:', policyError);
      throw policyError;
    }

    console.log('有給休暇ポリシー情報取得完了:', { policy, leaveType });
    return { policy, leaveType };
  } catch (error) {
    console.error('有給休暇ポリシー情報取得エラー:', error);
    throw error;
  }
}

/**
 * 有給休暇ポリシーに基づいてフォーム設定を生成
 */
export async function generatePaidLeaveFormConfig(
  policy: LeavePolicyInfo | null,
  leaveType: LeaveTypeInfo | null
): Promise<FormFieldConfig[]> {
  console.log('generatePaidLeaveFormConfig開始:', { policy, leaveType });

  const baseFields: FormFieldConfig[] = [
    {
      id: `field_${Date.now()}_1`,
      name: 'leave_type',
      type: 'select',
      label: '休暇種別',
      order: 1,
      width: 'full',
      options: [leaveType?.name || '有給休暇'],
      required: true,
      validation_rules: [
        {
          type: 'required',
          message: '休暇種別を選択してください',
        },
      ],
    },
    {
      id: `field_${Date.now()}_2`,
      name: 'start_date',
      type: 'date',
      label: '開始日',
      order: 2,
      width: 'half',
      required: true,
      validation_rules: [
        {
          type: 'required',
          message: '開始日を入力してください',
        },
      ],
    },
    {
      id: `field_${Date.now()}_3`,
      name: 'end_date',
      type: 'date',
      label: '終了日',
      order: 3,
      width: 'half',
      required: true,
      validation_rules: [
        {
          type: 'required',
          message: '終了日を入力してください',
        },
      ],
    },
    {
      id: `field_${Date.now()}_4`,
      name: 'start_time',
      type: 'time',
      label: '開始時刻',
      order: 4,
      width: 'half',
      required: false,
      validation_rules: [],
    },
    {
      id: `field_${Date.now()}_5`,
      name: 'end_time',
      type: 'time',
      label: '終了時刻',
      order: 5,
      width: 'half',
      required: false,
      validation_rules: [],
    },
    {
      id: `field_${Date.now()}_6`,
      name: 'half_day_period',
      type: 'select',
      label: '半日区分',
      order: 6,
      width: 'half',
      options: ['前半', '後半'],
      required: false,
      validation_rules: [],
    },
    {
      id: `field_${Date.now()}_7`,
      name: 'days_count',
      type: 'number',
      label: '申請日数',
      order: 7,
      width: 'half',
      required: false,
      placeholder: '日数を入力してください',
      validation_rules: [],
    },
    {
      id: `field_${Date.now()}_8`,
      name: 'policy_info',
      type: 'textarea',
      label: 'ポリシー情報',
      order: 8,
      width: 'full',
      required: false,
      placeholder: '有給休暇ポリシーの詳細情報',
      validation_rules: [],
    },
    {
      id: `field_${Date.now()}_9`,
      name: 'reason',
      type: 'textarea',
      label: '申請理由',
      order: 9,
      width: 'full',
      required: true,
      placeholder: '申請理由を入力してください',
      validation_rules: [
        {
          type: 'required',
          message: '申請理由を入力してください',
        },
      ],
    },
  ];

  // ポリシー情報がある場合は、ポリシー情報フィールドに値を設定
  if (policy) {
    const policyInfoField = baseFields.find((field) => field.name === 'policy_info');
    if (policyInfoField) {
      policyInfoField.placeholder = `ポリシー: ${policy.id || '未設定'}\n営業日のみ: ${policy.business_day_only ? 'はい' : 'いいえ'}\n1日の時間: ${policy.day_hours || 8}時間\n最小単位: ${policy.min_booking_unit_minutes || 60}分`;
    }
  }

  console.log('生成されたフォーム設定:', baseFields);
  return baseFields;
}

/**
 * 有給休暇ポリシーの一部を更新
 */
export async function updateLeavePolicyPartial({
  companyId,
  leaveTypeId,
  patch,
}: {
  companyId: string;
  leaveTypeId: string;
  patch: Partial<{
    fiscal_start_month: number;
    day_hours: number;
    anniversary_offset_days: number;
    monthly_proration: boolean;
    monthly_proration_basis: 'days' | 'hours';
    monthly_min_attendance_rate: number;
    base_days_by_service: BaseDaysByService;
    carryover_max_days: number | null;
    expire_months: number;
    allow_negative: boolean;
    min_booking_unit_minutes: number;
    rounding_minutes: number;
    hold_on_apply: boolean;
    deduction_timing: 'apply' | 'approve';
    business_day_only: boolean;
    allowed_units: Array<'day' | 'half' | 'hour'>;
    half_day_mode: 'fixed_hours' | 'am_pm';
    allow_multi_day: boolean;
    blackout_dates: string[];
    accrual_method: 'fiscal_fixed' | 'attendance_based' | 'hours_based';
  }>;
}) {
  try {
    const supabase = createAdminClient();

    // 既存のポリシーを確認
    const { data: existingPolicy, error: checkError } = await supabase
      .from('leave_policies')
      .select('id')
      .eq('company_id', companyId)
      .eq('leave_type_id', leaveTypeId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .maybeSingle();

    if (checkError) {
      console.error('ポリシー確認エラー:', checkError);
      throw checkError;
    }

    let result;
    if (existingPolicy) {
      // 既存のポリシーを更新
      const { data, error } = await supabase
        .from('leave_policies')
        .update({
          ...patch,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPolicy.id)
        .select()
        .single();

      if (error) {
        console.error('ポリシー更新エラー:', error);
        throw error;
      }
      result = data;
    } else {
      // 新しいポリシーを作成
      const { data, error } = await supabase
        .from('leave_policies')
        .insert({
          company_id: companyId,
          leave_type_id: leaveTypeId,
          ...patch,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('ポリシー作成エラー:', error);
        throw error;
      }
      result = data;
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('ポリシー更新エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
