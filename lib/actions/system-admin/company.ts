'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  AppError,
  validateEmail,
  validatePassword,
  validateRequired,
  withErrorHandling,
} from '@/lib/utils/error-handling';
import { logAudit, logSystem } from '@/lib/utils/log-system';
import {
  UpdateCompanyInput,
  type CompanyListResponse,
  type CompanySearchParams,
  type CompanyStats,
  type CompanyValidationResult,
  type CreateCompanyFormData,
  type CreateCompanyResult,
  type DeleteCompanyResult,
  type EditCompanyFormData,
  type UpdateCompanyResult,
} from '@/schemas/company';
import type { ValidationError } from '@/types/common';

// 環境変数の確認
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('NEXT_PUBLIC_SUPABASE_URL is not set');
}

if (!serviceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
}

// supabaseAdminは各関数内で作成する

/**
 * クライアント情報を取得
 */
async function getClientInfo() {
  try {
    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const userAgent = headersList.get('user-agent');

    // IPアドレスの取得（優先順位: x-forwarded-for > x-real-ip）
    let ipAddress = forwarded || realIp;
    if (ipAddress && ipAddress.includes(',')) {
      // 複数のIPが含まれている場合は最初のものを使用
      ipAddress = ipAddress.split(',')[0].trim();
    }

    return {
      ip_address: ipAddress || undefined,
      user_agent: userAgent || undefined,
      session_id: undefined, // セッションIDは別途取得が必要
    };
  } catch (error) {
    console.error('クライアント情報取得エラー:', error);
    return {
      ip_address: undefined,
      user_agent: undefined,
      session_id: undefined,
    };
  }
}

// ================================
// バリデーション関数
// ================================

/**
 * 企業作成フォームのバリデーション
 */
function validateCreateCompanyForm(form: CreateCompanyFormData): CompanyValidationResult {
  const errors: ValidationError[] = [];

  // 企業情報のバリデーション
  const nameError = validateRequired(form.name, '企業名');
  if (nameError) errors.push(nameError);

  const codeError = validateRequired(form.code, 'コード');
  if (codeError) errors.push(codeError);

  // グループ情報のバリデーション
  const groupNameError = validateRequired(form.group_name, '初期グループ名');
  if (groupNameError) errors.push(groupNameError);

  // 管理者情報のバリデーション
  const adminCodeError = validateRequired(form.admin_code, '管理者コード');
  if (adminCodeError) errors.push(adminCodeError);

  const familyNameError = validateRequired(form.admin_family_name, '管理者姓');
  if (familyNameError) errors.push(familyNameError);

  const firstNameError = validateRequired(form.admin_first_name, '管理者名');
  if (firstNameError) errors.push(firstNameError);

  const familyNameKanaError = validateRequired(form.admin_family_name_kana, '管理者姓カナ');
  if (familyNameKanaError) errors.push(familyNameKanaError);

  const firstNameKanaError = validateRequired(form.admin_first_name_kana, '管理者名カナ');
  if (firstNameKanaError) errors.push(firstNameKanaError);

  const emailError = validateEmail(form.admin_email, '管理者メールアドレス');
  if (emailError) errors.push(emailError);

  const passwordError = validatePassword(form.admin_password, '管理者パスワード');
  if (passwordError) errors.push(passwordError);

  return {
    isValid: errors.length === 0,
    errors: errors.map((error) => ({
      field: error.field as keyof CreateCompanyFormData,
      message: error.message,
      code: error.code || 'VALIDATION_ERROR',
    })),
  };
}

/**
 * 企業編集フォームのバリデーション
 */
function validateEditCompanyForm(form: EditCompanyFormData): CompanyValidationResult {
  const errors: ValidationError[] = [];

  const nameError = validateRequired(form.name, '企業名');
  if (nameError) errors.push(nameError);

  const codeError = validateRequired(form.code, 'コード');
  if (codeError) errors.push(codeError);

  return {
    isValid: errors.length === 0,
    errors: errors.map((error) => ({
      field: error.field as keyof EditCompanyFormData,
      message: error.message,
      code: error.code || 'VALIDATION_ERROR',
    })),
  };
}

// ================================
// データベース操作関数
// ================================

/**
 * コードの重複チェック
 */
async function checkCompanyCodeExists(code: string, excludeId?: string): Promise<boolean> {
  const supabaseAdmin = await createSupabaseServerClient();
  const query = supabaseAdmin
    .from('companies')
    .select('id')
    .eq('code', code)
    .is('deleted_at', null);

  if (excludeId) {
    query.neq('id', excludeId);
  }

  const { data } = await query;
  return (data?.length || 0) > 0;
}

/**
 * メールアドレスの重複チェック
 */
async function checkEmailExists(email: string): Promise<boolean> {
  const supabaseAdmin = await createSupabaseServerClient();
  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .is('deleted_at', null);

  return (data?.length || 0) > 0;
}

/**
 * コードの重複チェック
 */
async function checkUserCodeExists(code: string): Promise<boolean> {
  const supabaseAdmin = await createSupabaseServerClient();
  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('code', code)
    .is('deleted_at', null);

  return (data?.length || 0) > 0;
}

// ================================
// Server Actions
// ================================

/**
 * 企業作成（管理者ユーザー・グループ同時作成）
 */
export async function createCompany(
  form: CreateCompanyFormData,
  currentUserId?: string
): Promise<{ success: true; data: CreateCompanyResult } | { success: false; error: AppError }> {
  console.log('createCompany called with form:', { ...form, admin_password: '[REDACTED]' });

  // システムログ: 開始
  await logSystem('info', '企業作成開始', {
    feature_name: 'company_management',
    action_type: 'create_company',
    user_id: currentUserId,
    metadata: {
      company_name: form.name,
      company_code: form.code,
      admin_email: form.admin_email,
      admin_code: form.admin_code,
      group_name: form.group_name,
    },
  });

  // 環境変数の確認
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // システムログ: 環境変数エラー
    await logSystem('error', '企業作成時の環境変数エラー', {
      feature_name: 'company_management',
      action_type: 'create_company',
      user_id: currentUserId,
      error_message: '環境変数が正しく設定されていません',
    });

    console.error('Required environment variables are not set');
    return {
      success: false,
      error: new AppError('環境変数が正しく設定されていません', 'ENV_ERROR', 500),
    };
  }

  return withErrorHandling(async () => {
    const supabaseAdmin = await createSupabaseServerClient();

    // バリデーション
    const validation = validateCreateCompanyForm(form);
    if (!validation.isValid) {
      // システムログ: バリデーションエラー
      await logSystem('warn', '企業作成時のバリデーションエラー', {
        feature_name: 'company_management',
        action_type: 'create_company',
        user_id: currentUserId,
        error_message: 'バリデーションエラー',
        metadata: {
          validation_errors: validation.errors.map((e) => `${e.field}: ${e.message}`),
        },
      });

      throw AppError.fromValidationErrors(validation.errors, '企業作成');
    }

    // コードの重複チェック
    const codeExists = await checkCompanyCodeExists(form.code);
    if (codeExists) {
      // システムログ: 重複エラー
      await logSystem('warn', '企業作成時のコード重複エラー', {
        feature_name: 'company_management',
        action_type: 'create_company',
        user_id: currentUserId,
        error_message: 'コードが重複しています',
        metadata: { code: form.code },
      });

      throw AppError.duplicate('コード', form.code);
    }

    // メールアドレスの重複チェック
    const emailExists = await checkEmailExists(form.admin_email);
    if (emailExists) {
      // システムログ: 重複エラー
      await logSystem('warn', '企業作成時のメールアドレス重複エラー', {
        feature_name: 'company_management',
        action_type: 'create_company',
        user_id: currentUserId,
        error_message: 'メールアドレスが重複しています',
        metadata: { email: form.admin_email },
      });

      throw AppError.duplicate('メールアドレス', form.admin_email);
    }

    // 管理者コードの重複チェック
    const adminCodeExists = await checkUserCodeExists(form.admin_code);
    if (adminCodeExists) {
      // システムログ: 重複エラー
      await logSystem('warn', '企業作成時の管理者コード重複エラー', {
        feature_name: 'company_management',
        action_type: 'create_company',
        user_id: currentUserId,
        error_message: '管理者コードが重複しています',
        metadata: { admin_code: form.admin_code },
      });

      throw AppError.duplicate('管理者コード', form.admin_code);
    }

    // 1. 企業作成
    console.log('Creating company with data:', {
      name: form.name,
      code: form.code,
      address: form.address,
      phone: form.phone,
      is_active: form.is_active,
    });

    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert([
        {
          name: form.name,
          code: form.code,
          address: form.address,
          phone: form.phone,
          is_active: form.is_active,
        },
      ])
      .select()
      .single();

    if (companyError) {
      // システムログ: データベースエラー
      await logSystem('error', '企業作成時のデータベースエラー', {
        feature_name: 'company_management',
        action_type: 'create_company',
        user_id: currentUserId,
        error_message: companyError.message,
        metadata: { company_name: form.name, company_code: form.code },
      });

      console.error('Company creation error:', companyError);
      throw AppError.fromSupabaseError(companyError, '企業作成');
    }

    console.log('Company created successfully:', company);

    // 2. グループ作成
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .insert([
        {
          company_id: company.id,
          name: form.group_name,
        },
      ])
      .select()
      .single();

    if (groupError) {
      // 企業ロールバック
      await supabaseAdmin.from('companies').delete().eq('id', company.id);

      // システムログ: グループ作成エラー
      await logSystem('error', '企業作成時のグループ作成エラー', {
        feature_name: 'company_management',
        action_type: 'create_company',
        user_id: currentUserId,
        error_message: groupError.message,
        metadata: { company_id: company.id, group_name: form.group_name },
      });

      throw AppError.fromSupabaseError(groupError, 'グループ作成');
    }

    // 3. 管理者ユーザー作成（auth.users）
    const adminUserRes = await supabaseAdmin.auth.admin.createUser({
      email: form.admin_email,
      password: form.admin_password,
      email_confirm: true, // メール確認を自動的に完了
    });

    if (adminUserRes.error || !adminUserRes.data?.user) {
      // グループ・企業ロールバック
      await supabaseAdmin.from('groups').delete().eq('id', group.id);
      await supabaseAdmin.from('companies').delete().eq('id', company.id);

      // システムログ: Auth作成エラー
      await logSystem('error', '企業作成時の管理者ユーザー作成エラー', {
        feature_name: 'company_management',
        action_type: 'create_company',
        user_id: currentUserId,
        error_message: adminUserRes.error?.message || '管理者ユーザー作成に失敗しました',
        metadata: { company_id: company.id, admin_email: form.admin_email },
      });

      throw AppError.fromSupabaseError(
        adminUserRes.error || new Error('管理者ユーザー作成に失敗しました'),
        '管理者ユーザー作成'
      );
    }

    const adminUserId = adminUserRes.data.user.id;

    // 4. user_profiles作成
    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert([
      {
        id: adminUserId,
        code: form.admin_code,
        family_name: form.admin_family_name,
        first_name: form.admin_first_name,
        family_name_kana: form.admin_family_name_kana,
        first_name_kana: form.admin_first_name_kana,
        email: form.admin_email,
        role: 'admin',
        is_active: true,
      },
    ]);

    if (profileError) {
      // ユーザー・グループ・企業ロールバック
      await supabaseAdmin.auth.admin.deleteUser(adminUserId);
      await supabaseAdmin.from('groups').delete().eq('id', group.id);
      await supabaseAdmin.from('companies').delete().eq('id', company.id);

      // システムログ: プロフィール作成エラー
      await logSystem('error', '企業作成時のユーザープロフィール作成エラー', {
        feature_name: 'company_management',
        action_type: 'create_company',
        user_id: currentUserId,
        error_message: profileError.message,
        metadata: { company_id: company.id, admin_user_id: adminUserId },
      });

      throw AppError.fromSupabaseError(profileError, 'ユーザープロフィール作成');
    }

    // 5. user_groups作成
    const { error: userGroupError } = await supabaseAdmin.from('user_groups').insert([
      {
        user_id: adminUserId,
        group_id: group.id,
      },
    ]);

    if (userGroupError) {
      // user_profiles・ユーザー・グループ・企業ロールバック
      await supabaseAdmin.from('user_profiles').delete().eq('id', adminUserId);
      await supabaseAdmin.auth.admin.deleteUser(adminUserId);
      await supabaseAdmin.from('groups').delete().eq('id', group.id);
      await supabaseAdmin.from('companies').delete().eq('id', company.id);

      // システムログ: ユーザーグループ作成エラー
      await logSystem('error', '企業作成時のユーザーグループ作成エラー', {
        feature_name: 'company_management',
        action_type: 'create_company',
        user_id: currentUserId,
        error_message: userGroupError.message,
        metadata: { company_id: company.id, admin_user_id: adminUserId, group_id: group.id },
      });

      throw AppError.fromSupabaseError(userGroupError, 'ユーザーグループ作成');
    }

    // 6. 企業機能を作成（デフォルトで全て無効）
    const defaultFeatures = [
      {
        feature_code: 'chat',
        feature_name: 'チャット機能',
        description: '社内チャット機能',
        company_id: company.id,
        is_active: false,
        settings: {},
      },
      {
        feature_code: 'report',
        feature_name: 'レポート機能',
        description: '勤怠レポート・分析機能',
        company_id: company.id,
        is_active: false,
        settings: {},
      },
      {
        feature_code: 'schedule',
        feature_name: 'スケジュール機能',
        description: '勤務スケジュール管理機能',
        company_id: company.id,
        is_active: false,
        settings: {},
      },
    ];

    const { error: featuresError } = await supabaseAdmin.from('features').insert(defaultFeatures);

    if (featuresError) {
      console.error('企業機能作成エラー:', featuresError);
      // システムログ: 機能作成エラー（警告レベル）
      await logSystem('warn', '企業作成時の機能作成エラー', {
        feature_name: 'company_management',
        action_type: 'create_company',
        user_id: currentUserId,
        error_message: featuresError.message,
        metadata: { company_id: company.id, feature_count: defaultFeatures.length },
      });
      // 機能作成に失敗しても企業作成は成功とする（後で手動で追加可能）
    }

    // システムログ: 成功
    await logSystem('info', '企業作成成功', {
      feature_name: 'company_management',
      action_type: 'create_company',
      user_id: currentUserId,
      resource_id: company.id,
      metadata: {
        company_id: company.id,
        company_name: form.name,
        company_code: form.code,
        admin_user_id: adminUserId,
        group_id: group.id,
        feature_count: defaultFeatures.length,
      },
    });

    // 監査ログを記録
    if (currentUserId) {
      const clientInfo = await getClientInfo();
      try {
        await logAudit('company_created', {
          user_id: currentUserId,
          company_id: undefined, // system-adminは企業に属さない
          target_type: 'companies',
          target_id: company.id,
          before_data: undefined,
          after_data: {
            id: company.id,
            name: form.name,
            code: form.code,
            address: form.address,
            phone: form.phone,
            is_active: form.is_active,
            admin_user_id: adminUserId,
            group_id: group.id,
          },
          details: {
            admin_email: form.admin_email,
            admin_code: form.admin_code,
            group_name: form.group_name,
          },
          ip_address: clientInfo.ip_address,
          user_agent: clientInfo.user_agent,
          session_id: clientInfo.session_id,
        });
        console.log('監査ログ記録完了: company_created');
      } catch (error) {
        console.error('監査ログ記録エラー:', error);
        // システムログ: 監査ログ記録エラー
        await logSystem('error', '企業作成時の監査ログ記録エラー', {
          feature_name: 'company_management',
          action_type: 'create_company',
          user_id: currentUserId,
          resource_id: company.id,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } else {
      console.log('現在のユーザーIDが提供されていないため、監査ログを記録しません');
    }

    revalidatePath('/system-admin/company');
    return {
      company,
      groupId: group.id,
      adminUserId,
    };
  }, '企業作成');
}

/**
 * 企業更新
 */
export async function updateCompany(
  id: string,
  form: EditCompanyFormData,
  currentUserId?: string
): Promise<{ success: true; data: UpdateCompanyResult } | { success: false; error: AppError }> {
  // システムログ: 開始
  await logSystem('info', '企業更新開始', {
    feature_name: 'company_management',
    action_type: 'update_company',
    user_id: currentUserId,
    resource_id: id,
    metadata: {
      updated_fields: Object.keys(form),
    },
  });

  return withErrorHandling(async () => {
    const supabaseAdmin = await createSupabaseServerClient();

    // バリデーション
    const validation = validateEditCompanyForm(form);
    if (!validation.isValid) {
      // システムログ: バリデーションエラー
      await logSystem('warn', '企業更新時のバリデーションエラー', {
        feature_name: 'company_management',
        action_type: 'update_company',
        user_id: currentUserId,
        resource_id: id,
        error_message: 'バリデーションエラー',
        metadata: {
          validation_errors: validation.errors.map((e) => `${e.field}: ${e.message}`),
        },
      });

      throw AppError.fromValidationErrors(validation.errors, '企業更新');
    }

    // コードの重複チェック（自分以外）
    const codeExists = await checkCompanyCodeExists(form.code, id);
    if (codeExists) {
      // システムログ: 重複エラー
      await logSystem('warn', '企業更新時のコード重複エラー', {
        feature_name: 'company_management',
        action_type: 'update_company',
        user_id: currentUserId,
        resource_id: id,
        error_message: 'コードが重複しています',
        metadata: { code: form.code },
      });

      throw AppError.duplicate('コード', form.code);
    }

    // 企業の存在確認
    const { data: existingCompany, error: fetchError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingCompany) {
      // システムログ: 企業存在エラー
      await logSystem('error', '企業更新時の企業存在エラー', {
        feature_name: 'company_management',
        action_type: 'update_company',
        user_id: currentUserId,
        resource_id: id,
        error_message: fetchError?.message || '企業が見つかりません',
      });

      throw AppError.notFound('企業', id);
    }

    // 更新
    const { data: company, error: updateError } = await supabaseAdmin
      .from('companies')
      .update({
        name: form.name,
        code: form.code,
        address: form.address,
        phone: form.phone,
        is_active: form.is_active,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      // システムログ: データベースエラー
      await logSystem('error', '企業更新時のデータベースエラー', {
        feature_name: 'company_management',
        action_type: 'update_company',
        user_id: currentUserId,
        resource_id: id,
        error_message: updateError.message,
      });

      throw AppError.fromSupabaseError(updateError, '企業更新');
    }

    // 更新されたフィールドを特定
    const updatedFields: (keyof UpdateCompanyInput)[] = [];
    if (existingCompany.name !== form.name) updatedFields.push('name');
    if (existingCompany.code !== form.code) updatedFields.push('code');
    if (existingCompany.address !== form.address) updatedFields.push('address');
    if (existingCompany.phone !== form.phone) updatedFields.push('phone');
    if (existingCompany.is_active !== form.is_active) updatedFields.push('is_active');

    // システムログ: 成功
    await logSystem('info', '企業更新成功', {
      feature_name: 'company_management',
      action_type: 'update_company',
      user_id: currentUserId,
      resource_id: id,
      metadata: {
        updated_fields: updatedFields,
        company_name: form.name,
        company_code: form.code,
      },
    });

    // 監査ログを記録
    if (currentUserId) {
      const clientInfo = await getClientInfo();
      try {
        await logAudit('company_updated', {
          user_id: currentUserId,
          company_id: undefined, // system-adminは企業に属さない
          target_type: 'companies',
          target_id: id,
          before_data: existingCompany,
          after_data: { ...existingCompany, ...form },
          details: { updated_fields: updatedFields },
          ip_address: clientInfo.ip_address,
          user_agent: clientInfo.user_agent,
          session_id: clientInfo.session_id,
        });
        console.log('監査ログ記録完了: company_updated');
      } catch (error) {
        console.error('監査ログ記録エラー:', error);
        // システムログ: 監査ログ記録エラー
        await logSystem('error', '企業更新時の監査ログ記録エラー', {
          feature_name: 'company_management',
          action_type: 'update_company',
          user_id: currentUserId,
          resource_id: id,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } else {
      console.log('現在のユーザーIDが提供されていないため、監査ログを記録しません');
    }

    revalidatePath('/system-admin/company');
    return {
      company,
      updatedFields,
    };
  }, '企業更新');
}

/**
 * 企業削除（論理削除）
 */
export async function deleteCompany(
  id: string,
  currentUserId?: string
): Promise<{ success: true; data: DeleteCompanyResult } | { success: false; error: AppError }> {
  // システムログ: 開始
  await logSystem('info', '企業削除開始', {
    feature_name: 'company_management',
    action_type: 'delete_company',
    user_id: currentUserId,
    resource_id: id,
  });

  return withErrorHandling(async () => {
    const supabaseAdmin = await createSupabaseServerClient();

    // 企業の存在確認
    const { data: existingCompany, error: fetchError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingCompany) {
      // システムログ: 企業存在エラー
      await logSystem('error', '企業削除時の企業存在エラー', {
        feature_name: 'company_management',
        action_type: 'delete_company',
        user_id: currentUserId,
        resource_id: id,
        error_message: fetchError?.message || '企業が見つかりません',
      });

      throw AppError.notFound('企業', id);
    }

    // アクティブな企業は削除不可
    if (existingCompany.is_active) {
      // システムログ: バリデーションエラー
      await logSystem('warn', '企業削除時のアクティブ企業削除エラー', {
        feature_name: 'company_management',
        action_type: 'delete_company',
        user_id: currentUserId,
        resource_id: id,
        error_message: 'アクティブな企業は削除できません',
        metadata: { company_name: existingCompany.name, is_active: existingCompany.is_active },
      });

      throw new AppError(
        'アクティブな企業は削除できません。先に無効化してください。',
        'ACTIVE_COMPANY_DELETE_ERROR',
        400
      );
    }

    // 論理削除
    const { data: company, error: deleteError } = await supabaseAdmin
      .from('companies')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (deleteError) {
      // システムログ: データベースエラー
      await logSystem('error', '企業削除時のデータベースエラー', {
        feature_name: 'company_management',
        action_type: 'delete_company',
        user_id: currentUserId,
        resource_id: id,
        error_message: deleteError.message,
      });

      throw AppError.fromSupabaseError(deleteError, '企業削除');
    }

    // システムログ: 成功
    await logSystem('info', '企業削除成功', {
      feature_name: 'company_management',
      action_type: 'delete_company',
      user_id: currentUserId,
      resource_id: id,
      metadata: {
        company_name: existingCompany.name,
        company_code: existingCompany.code,
        deletion_type: 'logical',
      },
    });

    // 監査ログを記録
    if (currentUserId) {
      const clientInfo = await getClientInfo();
      try {
        await logAudit('company_deleted', {
          user_id: currentUserId,
          company_id: undefined, // system-adminは企業に属さない
          target_type: 'companies',
          target_id: id,
          before_data: existingCompany,
          after_data: undefined,
          details: { deletion_type: 'logical', deleted_at: company.deleted_at },
          ip_address: clientInfo.ip_address,
          user_agent: clientInfo.user_agent,
          session_id: clientInfo.session_id,
        });
        console.log('監査ログ記録完了: company_deleted');
      } catch (error) {
        console.error('監査ログ記録エラー:', error);
        // システムログ: 監査ログ記録エラー
        await logSystem('error', '企業削除時の監査ログ記録エラー', {
          feature_name: 'company_management',
          action_type: 'delete_company',
          user_id: currentUserId,
          resource_id: id,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } else {
      console.log('現在のユーザーIDが提供されていないため、監査ログを記録しません');
    }

    revalidatePath('/system-admin/company');
    return {
      companyId: id,
      deletedAt: company.deleted_at!,
    };
  }, '企業削除');
}

/**
 * 企業一覧取得
 */
export async function getCompanies(
  params: CompanySearchParams = {}
): Promise<{ success: true; data: CompanyListResponse } | { success: false; error: AppError }> {
  // システムログ: 開始
  await logSystem('info', '企業一覧取得開始', {
    feature_name: 'company_management',
    action_type: 'get_companies',
    metadata: {
      search_params: params,
    },
  });

  return withErrorHandling(async () => {
    const supabaseAdmin = await createSupabaseServerClient();

    const {
      search = '',
      status = 'all',
      page = 1,
      limit = 50,
      orderBy = 'updated_at',
      ascending = false,
    } = params;

    let query = supabaseAdmin.from('companies').select('*', { count: 'exact' });

    // 削除済みを除外
    query = query.is('deleted_at', null);

    // ステータスフィルター
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // 検索フィルター
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      query = query.or(
        `name.ilike.%${searchLower}%,code.ilike.%${searchLower}%,address.ilike.%${searchLower}%,phone.ilike.%${searchLower}%`
      );
    }

    // ソート
    query = query.order(orderBy, { ascending });

    // ページネーション
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: companies, error, count } = await query;

    if (error) {
      // システムログ: データベースエラー
      await logSystem('error', '企業一覧取得時のデータベースエラー', {
        feature_name: 'company_management',
        action_type: 'get_companies',
        error_message: error.message,
        metadata: { search_params: params },
      });

      throw AppError.fromSupabaseError(error, '企業一覧取得');
    }

    // 統計情報を取得
    const { data: allCompanies } = await supabaseAdmin
      .from('companies')
      .select('is_active, deleted_at');

    const total = count || 0;
    const activeCount = allCompanies?.filter((c) => c.is_active && !c.deleted_at).length || 0;
    const deletedCount = allCompanies?.filter((c) => c.deleted_at).length || 0;
    const totalPages = Math.ceil(total / limit);

    // システムログ: 成功
    await logSystem('info', '企業一覧取得成功', {
      feature_name: 'company_management',
      action_type: 'get_companies',
      metadata: {
        total_companies: total,
        returned_companies: companies?.length || 0,
        active_count: activeCount,
        deleted_count: deletedCount,
        page,
        limit,
        search_params: params,
      },
    });

    return {
      companies: companies || [],
      total,
      activeCount,
      deletedCount,
      pagination: {
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }, '企業一覧取得');
}

/**
 * 企業統計情報取得
 */
export async function getCompanyStats(): Promise<
  { success: true; data: CompanyStats } | { success: false; error: AppError }
> {
  // システムログ: 開始
  await logSystem('info', '企業統計取得開始', {
    feature_name: 'company_management',
    action_type: 'get_company_stats',
  });

  return withErrorHandling(async () => {
    const supabaseAdmin = await createSupabaseServerClient();

    const { data: companies, error } = await supabaseAdmin
      .from('companies')
      .select('is_active, deleted_at, created_at, updated_at');

    if (error) {
      // システムログ: データベースエラー
      await logSystem('error', '企業統計取得時のデータベースエラー', {
        feature_name: 'company_management',
        action_type: 'get_company_stats',
        error_message: error.message,
      });

      throw AppError.fromSupabaseError(error, '企業統計取得');
    }

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats: CompanyStats = {
      total: companies?.length || 0,
      active: companies?.filter((c) => c.is_active && !c.deleted_at).length || 0,
      inactive: companies?.filter((c) => !c.is_active && !c.deleted_at).length || 0,
      deleted: companies?.filter((c) => c.deleted_at).length || 0,
      createdThisMonth: companies?.filter((c) => new Date(c.created_at) >= thisMonth).length || 0,
      updatedThisMonth: companies?.filter((c) => new Date(c.updated_at) >= thisMonth).length || 0,
    };

    // システムログ: 成功
    await logSystem('info', '企業統計取得成功', {
      feature_name: 'company_management',
      action_type: 'get_company_stats',
      metadata: {
        total_companies: stats.total,
        active_companies: stats.active,
        inactive_companies: stats.inactive,
        deleted_companies: stats.deleted,
        created_this_month: stats.createdThisMonth,
        updated_this_month: stats.updatedThisMonth,
      },
    });

    return stats;
  }, '企業統計取得');
}
