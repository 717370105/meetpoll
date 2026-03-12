// api/polls/[id].js  →  GET /api/polls/:id
const { ok, fail, fetchPoll } = require('../_supabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return fail(res, 'Method not allowed', 405);

  const { id } = req.query;
  const result = await fetchPoll(id);
  if (!result) return fail(res, '征集不存在', 404);
  ok(res, result);
};
