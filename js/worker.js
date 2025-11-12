// worker.js
export default {
  async fetch(req, env) {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }
    try {
      const input = await req.json();
      const name = (input.name || '受測者').toString().slice(0, 20);
      const total = Number(input.totalScore ?? 0);
      const themeScores = input.themeScores || {};
      const answers = Array.isArray(input.answers) ? input.answers.slice(0, 50) : [];

      const prompt = buildPrompt({ name, total, themeScores, answers });

      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.4,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: '你是一位青少年數位健康輔導教練。請用繁體中文，語氣溫和、不說教。輸出 JSON（不要有 Markdown）。'
            },
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!r.ok) {
        const err = await r.text();
        return new Response(JSON.stringify({ ok:false, error: 'LLM_ERROR', detail: err }), { status: 500 });
      }
      const data = await r.json();
      const aiJson = safeParseJSON(data?.choices?.[0]?.message?.content) || {
        summary: '分析暫無法生成，請稍後重試。',
        risk_level: 'unknown',
        why: [],
        suggestions: [],
        micro_habits: [],
        theme_feedback: {},
        resources: []
      };

      return new Response(JSON.stringify({ ok: true, analysis: aiJson }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });

    } catch (e) {
      return new Response(JSON.stringify({ ok:false, error: 'SERVER_ERROR', detail: String(e) }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

function buildPrompt({ name, total, themeScores, answers }) {
  const themeLines = Object.entries(themeScores)
    .map(([k, v]) => `- ${k}: ${v} 分`).join('\n');
  const answerBrief = answers.map(a =>
    `Q${a.q + 1}. ${a.text}\n→ 選項：「${a.optionText || ''}」（${a.score} 分）`).join('\n\n');

  return `
【測驗對象】${name}
【總分】${total}

【主題分數】
${themeLines || '（無）'}

【題目與作答摘要】（僅供你抓線索，不要逐題重述）
${answerBrief || '（略）'}

請輸出 JSON（不要有 Markdown）：
{
  "summary": "2~3 句總結現況與風險重點",
  "risk_level": "low | medium | high",
  "why": ["2~4 個最關鍵觀察"],
  "theme_feedback": { "<主題名>": { "level": "low|medium|high", "note": "一句話重點" } },
  "suggestions": [
    { "title": "具體建議", "steps": ["步驟1","步驟2"], "est_impact": "可能改善項目" }
  ],
  "micro_habits": ["7–14天可嘗試的小習慣…"],
  "resources": [{ "name":"工具或資源", "type":"app|article|video", "note":"簡述用途"}]
}
注意：避免醫療診斷語，聚焦行為改變；高分時加入尋求協助建議。
`.trim();
}
function safeParseJSON(s){ try{ return JSON.parse(s) } catch { return null } }
