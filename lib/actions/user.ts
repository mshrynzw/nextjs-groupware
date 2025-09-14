'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logAudit, logSystem } from '@/lib/utils/log-system';
import type { UserProfile } from '@/schemas/user_profile';

/**
 * メンバー用のユーザー一覧を取得
 * 現在のユーザーが所属する企業のユーザーのみを取得
 */
interface GetCompanyUsersParams {
  userId: string;
  companyId: string;
}
export async function getCompanyUsers({ userId, companyId }: GetCompanyUsersParams): Promise<{
  success: boolean;
  data?: UserProfile[];
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();

  try {
    // 企業内のユーザーを取得
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('code', { ascending: true });

    if (error) {
      // システムログ: データベースエラー
      await logSystem('error', 'ユーザー取得エラー', {
        feature_name: 'user_management',
        action_type: 'get_users',
        user_id: userId,
        company_id: companyId,
        error_message: error.message,
      });

      console.error('ユーザー取得エラー:', error);
      return {
        success: false,
        error: 'ユーザーの取得に失敗しました',
      };
    }

    // システムログ: 成功
    await logSystem('info', 'ユーザー一覧取得成功', {
      feature_name: 'user_management',
      action_type: 'get_users',
      user_id: userId,
      company_id: companyId,
      metadata: {
        total_users: users?.length || 0,
        company_users: users?.length || 0,
      },
    });

    // 監査ログ: ユーザー一覧閲覧
    await logAudit('user_list_viewed', {
      user_id: userId,
      company_id: companyId,
      target_type: 'user_profiles',
      details: {
        total_users: users?.length || 0,
        action: 'view_user_list',
      },
    });

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    // システムログ: 予期しないエラー
    await logSystem('error', 'getUsers 予期しないエラー', {
      feature_name: 'user_management',
      action_type: 'get_users',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      error_stack: error instanceof Error ? error.stack : undefined,
    });

    console.error('getUsers エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
