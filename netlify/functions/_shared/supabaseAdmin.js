// Supabase client ฝั่ง server — ใช้ SERVICE_ROLE_KEY (ข้าม RLS) ห้ามหลุดไป client เด็ดขาด
// ใช้ใน pre-generate/เขียน cache. โมดูลใน _shared/ ไม่ถูก deploy เป็น endpoint (ขึ้นต้น _)
const { createClient } = require('@supabase/supabase-js');

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('ยังไม่ได้ตั้ง SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

module.exports = { getAdminClient };
