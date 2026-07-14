// POST /.netlify/functions/generate-quest — generate สดเฉพาะหัวข้อพิมพ์อิสระ (gemini-3-flash)
// STUB: ลอจิกจริงเสียบใน ticket #06/#07
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
