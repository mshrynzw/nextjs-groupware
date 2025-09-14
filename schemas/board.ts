import { z } from 'zod';

// ================================
// 掲示板（Board）関連スキーマ
// ================================

/**
 * 掲示板ステータス
 */
export const BoardStatusSchema = z.enum([
  'draft',
  'pending',
  'published',
  'unpublished',
  'archived',
]);

/**
 * タグ
 */
export const BoardTagSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string().default('#f59e42'),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().optional(),
});

/**
 * 掲示板本体
 */
export const BoardSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  detail: z.string(),
  status: BoardStatusSchema,
  tags: z.array(BoardTagSchema).optional(),
  created_by: z.string().uuid(),
  updated_by: z.string().uuid().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  published_at: z.string().optional(),
  archived_at: z.string().optional(),
  deleted_at: z.string().optional(),
});

/**
 * 既読管理
 */
export const BoardReadSchema = z.object({
  board_id: z.string().uuid(),
  user_id: z.string().uuid(),
  read_at: z.string(),
});

/**
 * ステータス履歴
 */
export const BoardStatusHistorySchema = z.object({
  id: z.string().uuid(),
  board_id: z.string().uuid(),
  status: BoardStatusSchema,
  changed_by: z.string().uuid(),
  changed_at: z.string(),
});

// ================================
// 型エクスポート
// ================================
export type BoardStatus = z.infer<typeof BoardStatusSchema>;
export type BoardTag = z.infer<typeof BoardTagSchema>;
export type Board = z.infer<typeof BoardSchema>;
export type BoardRead = z.infer<typeof BoardReadSchema>;
export type BoardStatusHistory = z.infer<typeof BoardStatusHistorySchema>;
