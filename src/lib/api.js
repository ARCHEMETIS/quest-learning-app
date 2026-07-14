// Helper เรียก Netlify Functions — frontend เรียก /.netlify/functions/* ตรง ๆ (ดู deploy-plan.md sec.3)
const BASE = '/.netlify/functions';

async function callFn(name, body, token) {
  const res = await fetch(`${BASE}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`fn ${name} ล้มเหลว (${res.status}): ${detail}`);
  }
  return res.json();
}

// ลอจิกจริงเสียบใน ticket #06/#07 — ตอนนี้เป็นแค่ทางเข้า
export const api = {
  chat: (payload, token) => callFn('chat', payload, token),
  generateQuest: (payload, token) => callFn('generate-quest', payload, token),
};
