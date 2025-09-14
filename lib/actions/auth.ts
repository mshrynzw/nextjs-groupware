'use server';

import { headers } from 'next/headers';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logAudit, logSystem } from '@/lib/utils/log-system';

export async function loginAction(formData: FormData): Promise<{ ok: boolean; error?: Error }> {
  // クライアント情報を取得
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const userAgent = headersList.get('user-agent');

  let ipAddress = forwarded || realIp;
  if (ipAddress && ipAddress.includes(',')) {
    ipAddress = ipAddress.split(',')[0].trim();
  }
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  console.log('ログイン処理完了');
  try {
    // システムログ: 開始
    await logSystem('info', 'ログイン処理開始', {
      feature_name: 'authentication',
      action_type: 'login_attempt',
      metadata: {
        email: email,
        has_password: !!password,
      },
    });

    if (!email || !password) {
      // システムログ: バリデーションエラー
      await logSystem('warn', 'ログイン時のバリデーションエラー', {
        feature_name: 'authentication',
        action_type: 'login_attempt',
        error_message: 'メールアドレスまたはパスワードが空',
        metadata: {
          email: email,
          has_password: !!password,
        },
      });

      throw new Error('メールアドレスとパスワードを入力してください');
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('認証失敗: ユーザーが存在しません');
    }

    return { ok: true };
  } catch (error) {
    await logAudit('user_login_failed', {
      user_id: undefined,
      target_type: 'auth',
      target_id: undefined,
      before_data: undefined,
      after_data: undefined,
      details: {
        login_method: 'password',
        email: email,
        failure_reason: 'invalid_credentials',
        user_agent: userAgent || null,
        ip_address: ipAddress || null,
      },
      ip_address: ipAddress || undefined,
      user_agent: userAgent || undefined,
    });

    return { ok: false, error: new Error('ログインに失敗しました') };
  } finally {
    console.log('ログイン処理完了');
  }
}

export async function logoutAction(userId?: string): Promise<{ ok: boolean; error?: Error }> {
  console.log('ログアウトServer Action開始');

  // システムログ: 開始
  await logSystem('info', 'ログアウト処理開始', {
    feature_name: 'authentication',
    action_type: 'logout_attempt',
    user_id: userId,
  });

  // クライアント情報を取得
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const userAgent = headersList.get('user-agent');

  let ipAddress = forwarded || realIp;
  if (ipAddress && ipAddress.includes(',')) {
    ipAddress = ipAddress.split(',')[0].trim();
  }

  // ユーザーのcompany_idを取得
  let companyId: string | undefined;
  if (userId) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: userProfiles, error: userProfilesError } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', userId)
        .is('deleted_at', null)
        .single();

      if (!userProfilesError && userProfiles) {
        companyId = userProfiles.company_id as string;
        console.log('ログアウト時のcompany_id取得成功:', companyId);
      }
    } catch (error) {
      console.error('ログアウト時のcompany_id取得エラー:', error);
    }
  }

  // ログアウト監査ログを記録
  if (userId) {
    try {
      await logAudit('user_logout', {
        user_id: userId,
        company_id: companyId,
        target_type: 'auth',
        target_id: userId,
        before_data: undefined,
        after_data: undefined,
        details: {
          logout_method: 'manual',
          user_agent: userAgent || null,
          ip_address: ipAddress || null,
        },
        ip_address: ipAddress || undefined,
        user_agent: userAgent || undefined,
      });
      console.log('サーバーサイドログアウト監査ログ記録完了');
    } catch (error) {
      console.error('サーバーサイドログアウト監査ログ記録エラー:', error);
      return { ok: false, error: error as Error };
    }
  }

  // システムログ: 成功
  await logSystem('info', 'ログアウト処理完了', {
    feature_name: 'authentication',
    action_type: 'logout_success',
    user_id: userId,
  });

  console.log('ログアウトServer Action完了');
  return { ok: true };
}

/**
 * セッション期限切れログアウトアクション（サーバーサイド）
 */
// export async function sessionExpiredLogoutAction(userId?: string): Promise<void> {
//   console.log('セッション期限切れログアウトServer Action開始');

//   // システムログ: 開始
//   await logSystem('warn', 'セッション期限切れログアウト処理開始', {
//     feature_name: 'authentication',
//     action_type: 'session_expired_logout',
//     user_id: userId,
//   });

//   // クライアント情報を取得
//   const headersList = await headers();
//   const forwarded = headersList.get('x-forwarded-for');
//   const realIp = headersList.get('x-real-ip');
//   const userAgent = headersList.get('user-agent');

//   let ipAddress = forwarded || realIp;
//   if (ipAddress && ipAddress.includes(',')) {
//     ipAddress = ipAddress.split(',')[0].trim();
//   }

//   // ユーザーのcompany_idを取得
//   let companyId: string | undefined;
//   if (userId) {
//     try {
//       const supabase = await createSupabaseServerClient();
//       const { data: userGroups, error: userGroupsError } = await supabase
//         .from('user_groups')
//         .select(
//           `
//           groups!user_groups_group_id_fkey(
//             company_id
//           )
//         `
//         )
//         .eq('user_id', userId)
//         .is('deleted_at', null);

//       if (!userGroupsError && userGroups && userGroups.length > 0) {
//         const firstGroup = userGroups[0];
//         if (
//           firstGroup.groups &&
//           typeof firstGroup.groups === 'object' &&
//           'company_id' in firstGroup.groups
//         ) {
//           companyId = firstGroup.groups.company_id as string;
//           console.log('セッション期限切れ時のcompany_id取得成功:', companyId);
//         }
//       } else {
//         console.log('セッション期限切れ時のcompany_id取得失敗:', userGroupsError);
//       }
//     } catch (error) {
//       console.error('セッション期限切れ時のcompany_id取得エラー:', error);
//     }
//   }

//   // セッション期限切れログアウト監査ログを記録
//   if (userId) {
//     try {
//       await logAudit('user_logout', {
//         user_id: userId,
//         company_id: companyId,
//         target_type: 'auth',
//         target_id: userId,
//         before_data: undefined,
//         after_data: undefined,
//         details: {
//           logout_method: 'session_expired',
//           user_agent: userAgent || null,
//           ip_address: ipAddress || null,
//         },
//         ip_address: ipAddress || undefined,
//         user_agent: userAgent || undefined,
//       });
//       console.log('セッション期限切れログアウト監査ログ記録完了');
//     } catch (error) {
//       console.error('セッション期限切れログアウト監査ログ記録エラー:', error);
//     }
//   }

//   // システムログ: 完了
//   await logSystem('info', 'セッション期限切れログアウト処理完了', {
//     feature_name: 'authentication',
//     action_type: 'session_expired_logout',
//     user_id: userId,
//   });

//   console.log('セッション期限切れログアウトServer Action完了');
// }
