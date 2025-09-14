import { Board, BoardTag } from '@/schemas/board';

// 公開中の掲示一覧取得
export async function getBoardsForMember(): Promise<Board[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('*, board_tag_relations(tag_id), board_tags!board_tag_relations(tag_id)')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false });
  if (error) throw error;
  // タグを整形
  return (data || []).map((row: any) => ({
    ...row,
    tags: row.board_tags || [],
  }));
}

// タグ一覧取得
export async function getBoardTags(): Promise<BoardTag[]> {
  const { data, error } = await supabase
    .from('board_tags')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// 掲示作成
export async function createBoard({
  title,
  detail,
  tagIds,
  userId,
}: {
  title: string;
  detail: string;
  tagIds: string[];
  userId: string;
}): Promise<Board> {
  // 入力バリデーション
  if (!title.trim() || !detail.trim()) throw new Error('タイトル・詳細は必須です');
  const { data, error } = await supabase
    .from('boards')
    .insert({
      title,
      detail,
      status: 'published',
      created_by: userId,
      updated_by: userId,
      published_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  // タグ紐付け
  if (tagIds.length > 0) {
    await supabase
      .from('board_tag_relations')
      .insert(tagIds.map((tag_id) => ({ board_id: data.id, tag_id })));
  }
  // タグ情報も返す
  const tags = tagIds.length > 0 ? await getBoardTagsByIds(tagIds) : [];
  return { ...data, tags };
}

// タグ作成
export async function createBoardTag({
  name,
  color,
}: {
  name: string;
  color: string;
}): Promise<BoardTag> {
  if (!name.trim()) throw new Error('タグ名は必須です');
  const { data, error } = await supabase
    .from('board_tags')
    .insert({ name, color })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// タグ削除
export async function deleteBoardTag(tagId: string): Promise<void> {
  const { error } = await supabase
    .from('board_tags')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', tagId);
  if (error) throw error;
}

// 複数IDでタグ取得
export async function getBoardTagsByIds(tagIds: string[]): Promise<BoardTag[]> {
  if (tagIds.length === 0) return [];
  const { data, error } = await supabase
    .from('board_tags')
    .select('*')
    .in('id', tagIds)
    .is('deleted_at', null);
  if (error) throw error;
  return data || [];
}
