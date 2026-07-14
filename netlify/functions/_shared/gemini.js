// Gemini caller + fallback chain — โครงจาก deploy-plan.md sec.2 (ml-quest/netlify/functions ใช้อ้างอิงได้)
// chain: gemini-3-flash (งานหนัก) → flash-lite (แชท) → 2.5-flash → static fallback
// ลอจิกเต็ม (retry/parse 429/quota) เสียบใน ticket #07 (ai-pipeline)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MODEL_CHAIN = ['gemini-3-flash', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];

async function callModel(model, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!res.ok) {
    const err = new Error(`gemini ${model} → ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// พยายามไล่ chain — ตัวแรกที่สำเร็จชนะ (โครงคร่าว; ปรับ error handling ใน #07)
async function generate(prompt, { chain = MODEL_CHAIN } = {}) {
  if (!GEMINI_API_KEY) throw new Error('ยังไม่ได้ตั้ง GEMINI_API_KEY');
  let lastErr;
  for (const model of chain) {
    try {
      return await callModel(model, prompt);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

module.exports = { generate, MODEL_CHAIN };
