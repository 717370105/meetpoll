// api/polls.js  →  POST /api/polls
const { nanoid } = require('nanoid');
const { supabase, ok, fail, fetchPoll } = require('./_supabase');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') return fail(res, 'Method not allowed', 405);

  const { title, organizer, duration, note, slots } = req.body || {};

  if (!title?.trim()) return fail(res, '请填写会议主题');
  if (!Array.isArray(slots) || !slots.length) return fail(res, '请至少提供一个候选时间段');
  for (const s of slots) {
    if (!s.date || !s.start || !s.end) return fail(res, '时间段格式错误，需包含 date / start / end');
  }

  const id = nanoid(10);

  // 写入 poll
  const { error: pe } = await supabase.from('polls').insert({
    id,
    title: title.trim(),
    organizer: organizer?.trim() || '发起人',
    duration: duration?.trim() || '待定',
    note: note?.trim() || null,
  });
  if (pe) return fail(res, pe.message, 500);

  // 写入 slots
  const slotRows = slots.map((s, i) => ({
    poll_id: id, date: s.date, start_time: s.start, end_time: s.end, sort_order: i,
  }));
  const { error: se } = await supabase.from('slots').insert(slotRows);
  if (se) return fail(res, se.message, 500);

  const result = await fetchPoll(id);
  ok(res, result, 201);
};
