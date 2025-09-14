'use server';

import { logSystem } from '@/lib/utils/log-system';
import type { RequestForm } from '@/schemas/request';

export async function getRequestForms(): Promise<
  { success: true; data: RequestForm[] } | { success: false; error: string }
> {
  // システムログ: 開始
  await logSystem('info', '申請フォーム一覧取得開始', {
    feature_name: 'request_management',
    action_type: 'get_request_forms',
  });

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('request_forms')
      .select(
        `
        id,
        code,
        name,
        description,
        category,
        form_config,
        approval_flow,
        object_config,
        is_active,
        display_order,
        created_at,
        updated_at,
        deleted_at
      `
      )
      .is('deleted_at', null)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      await logSystem('error', '申請フォーム一覧取得時のデータベースエラー', {
        feature_name: 'request_management',
        action_type: 'get_request_forms',
        error_message: error.message,
      });
      return { success: false, error: error.message };
    }

    await logSystem('info', '申請フォーム一覧取得成功', {
      feature_name: 'request_management',
      action_type: 'get_request_forms',
      metadata: { count: data?.length || 0 },
    });

    return { success: true, data: (data || []) as unknown as RequestForm[] };
  } catch (e) {
    await logSystem('error', '申請フォーム一覧取得時の予期しないエラー', {
      feature_name: 'request_management',
      action_type: 'get_request_forms',
      error_message: e instanceof Error ? e.message : 'Unknown error',
    });
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
