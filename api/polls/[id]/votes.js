// api/polls/[id]/votes.js  →  POST /api/polls/:id/votes
const { supabase, ok, fail, fetchPoll } = require('../../_supabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return fail(res, 'Method not allowed', 405);

  const poll_id = req.query.id;
  const { voter_name, slot_ids } = req.body || {};

  if (!voter_name?.trim()) return fail(res, '请填写姓名');
  if (!Array.isArray(slot_ids) || !slot_ids.length) return fail(res, '请至少选择一个时间段');

  // 确认 poll 存在
  const existing = await fetchPoll(poll_id);
  if (!existing) return fail(res, '征集不存在', 404);

  // 确认 slot_ids 合法
  const validIds = new Set(existing.slots.map(s => s.id));
  if (!slot_ids.every(id => validIds.has(id))) return fail(res, '包含无效的时间段 ID');

  const name = voter_name.trim();

  // Upsert vote（同名覆盖）
  const { data: voteRow, error: ve } = await supabase
    .from('votes')
    .upsert({ poll_id, voter_name: name }, { onConflict: 'poll_id,voter_name' })
    .select('id')
    .single();
  if (ve) return fail(res, ve.message, 500);

  const vote_id = voteRow.id;

  // 清除旧选择
  await supabase.from('vote_slots').delete().eq('vote_id', vote_id);

  // 写入新选择
  const rows = slot_ids.map(sid => ({ vote_id, slot_id: sid }));
  const { error: vse } = await supabase.from('vote_slots').insert(rows);
  if (vse) return fail(res, vse.message, 500);

  const result = await fetchPoll(poll_id);
  ok(res, result);
};
