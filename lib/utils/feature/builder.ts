import 'server-only';

import type { FeatureKey, MenuItem } from '@/components/common/sidebar/Menu';
import {
  adminMenuItems,
  baseUserMenuItems,
  systemAdminMenuItems,
} from '@/components/common/sidebar/Menu';
import type { Role } from '@/types/user';

type Features = Partial<Record<FeatureKey, boolean>>;

/**
 * ユーザーのrole/機能フラグ/現在の領域に基づいて
 * 表示すべきメニュー配列をサーバーで確定する。
 */
export function getMenuFor(role: Role, features: Features, area: string): MenuItem[] {
  // 1) roleに応じたベース配列を選ぶ
  let base: MenuItem[];
  switch (role) {
    case 'system-admin':
      // system-admin は全エリアにアクセス可能なので area で振り分け
      if (area === 'member') {
        base = baseUserMenuItems;
      } else if (area === 'admin') {
        base = adminMenuItems;
      } else {
        base = systemAdminMenuItems;
      }
      break;

    case 'admin':
      // admin は member と admin の2種類
      if (area === 'member') {
        base = baseUserMenuItems;
      } else {
        base = adminMenuItems;
      }
      break;

    case 'member':
    default:
      base = baseUserMenuItems;
  }

  // 2) featureフラグで絞り込み（feature指定がある項目のみ判定）
  return base.filter((item) => {
    if ('features' in item && item.features && typeof item.features === 'string') {
      return !!(features as Record<string, boolean>)[item.features];
    }
    return true;
  });
}

/**
 * （任意）activeフラグを付与したい場合
 */
// export function markActive<T extends MenuItem>(
//   menu: T[],
//   pathname: string
// ): (T & { active?: boolean })[] {
//   return menu.map((item) => {
//     if ('href' in item && item.href) {
//       const active = pathname === item.href || pathname.startsWith(item.href + '/')
//       return { ...item, active }
//     }
//     return item
//   })
// }
