// POST /.netlify/functions/chat — แชทโค้ช AI (flash-lite) จำกัด 10 ข้อความ/คน/วัน
// STUB: ลอจิกจริง (auth check ต่อ user + rate limit ใน Supabase + gemini) เสียบใน ticket #06/#07
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  return {
    statusCode: 501,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'ยังไม่ implement (ticket #06/#07)' }),
  };
};
