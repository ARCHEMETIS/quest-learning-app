import { createClient } from '@supabase/supabase-js';

// Client-side Supabase — ใช้ anon key (ปลอดภัยเมื่อเปิด RLS ทุกตาราง ตาม supabase-schema.md)
// ค่ามาจาก .env (VITE_ prefix เท่านั้นที่ฝังลง bundle)
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // ไม่ throw เพื่อให้ scaffold รัน dev ได้ก่อนตั้ง env จริง — เตือนใน console แทน
  console.warn('[supabase] ยังไม่ได้ตั้ง VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (.env)');
}

export const supabase = createClient(url ?? '', anonKey ?? '');
