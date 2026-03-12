// api/ai-suggest.js  →  POST /api/ai-suggest
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.json({ success: true, suggestion: '（AI 分析未配置，请在 Vercel 环境变量中设置 ANTHROPIC_API_KEY）' });
  }

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ success: false, message: '缺少 prompt' });

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await upstream.json();
    const suggestion = data.content?.map(c => c.text || '').join('') || '分析失败，请重试';
    res.json({ success: true, suggestion });
  } catch (err) {
    res.json({ success: true, suggestion: 'AI 分析暂时不可用，请根据投票数据手动决策。' });
  }
};
