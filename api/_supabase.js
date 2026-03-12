// api/_supabase.js — 共享 Supabase 客户端
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ── 工具函数 ──────────────────────────────────────────────────────────

function ok(res, data, status = 200) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).json({ success: true, data });
}

function fail(res, message, status = 400) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).json({ success: false, message });
}

/**
 * 读取一个 poll 的完整数据（含 slots、votes、tally）
 */
async function fetchPoll(id) {
  const { data: poll, error: pe } = await supabase
    .from('polls').select('*').eq('id', id).single();
  if (pe || !poll) return null;

  const { data: slots } = await supabase
    .from('slots').select('*').eq('poll_id', id).order('sort_order');

  const { data: votes } = await supabase
    .from('votes').select('*').eq('poll_id', id).order('voted_at');

  // 批量获取所有 vote_slots
  const voteIds = (votes || []).map(v => v.id);
  let voteSlots = [];
  if (voteIds.length) {
    const { data } = await supabase
      .from('vote_slots').select('*').in('vote_id', voteIds);
    voteSlots = data || [];
  }

  // 为每票附上 slot_ids
  const enrichedVotes = (votes || []).map(v => ({
    ...v,
    slot_ids: voteSlots.filter(vs => vs.vote_id === v.id).map(vs => vs.slot_id),
  }));

  // 按 slot 汇总参与人名单
  const tally = {};
  (slots || []).forEach(s => { tally[s.id] = []; });
  enrichedVotes.forEach(v => {
    v.slot_ids.forEach(sid => { if (tally[sid]) tally[sid].push(v.voter_name); });
  });

  return { poll, slots: slots || [], votes: enrichedVotes, tally };
}

module.exports = { supabase, ok, fail, fetchPoll };
