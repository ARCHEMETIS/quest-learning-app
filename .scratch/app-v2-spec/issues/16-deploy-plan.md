# แผน deploy และโครงโปรเจกต์บน Netlify

Type: task
Status: open

## Question

วางแผน (เอกสาร ไม่ใช่ลงมือ) โครงโปรเจกต์และ deploy ของลุยเควสตาม stack ที่ล็อกใน [สถาปัตยกรรมและ tech stack](07-tech-stack.md): โครงโฟลเดอร์ repo `luiquest` (Vite+React app, `netlify/functions/`, scheduled function), ตั้งค่า `netlify.toml` (build command, functions, cron ของ scheduled function), รายการ env vars (Supabase URL/keys, Gemini key — อะไรอยู่ฝั่ง function เท่านั้น), ชื่อ site `luiquest.netlify.app`, flow deploy จาก GitHub (auto-deploy จาก main), และเช็คลิสต์ตั้งค่า Supabase project + Google OAuth สำหรับ Sign-in — ผลลัพธ์เป็นไฟล์ markdown แนบเป็น asset พร้อมให้ effort ถัดไปทำตามได้เลย
