# แผน deploy และโครงโปรเจกต์บน Netlify

Type: task
Status: resolved (2026-07-12)

## Question

วางแผน (เอกสาร ไม่ใช่ลงมือ) โครงโปรเจกต์และ deploy ของลุยเควสตาม stack ที่ล็อกใน [สถาปัตยกรรมและ tech stack](07-tech-stack.md): โครงโฟลเดอร์ repo `luiquest` (Vite+React app, `netlify/functions/`, scheduled function), ตั้งค่า `netlify.toml` (build command, functions, cron ของ scheduled function), รายการ env vars (Supabase URL/keys, Gemini key — อะไรอยู่ฝั่ง function เท่านั้น), ชื่อ site `luiquest.netlify.app`, flow deploy จาก GitHub (auto-deploy จาก main), และเช็คลิสต์ตั้งค่า Supabase project + Google OAuth สำหรับ Sign-in — ผลลัพธ์เป็นไฟล์ markdown แนบเป็น asset พร้อมให้ effort ถัดไปทำตามได้เลย

## Answer (2026-07-12)

แผนฉบับเต็ม: [assets/deploy-plan.md](../assets/deploy-plan.md)

สรุป:

- **โครง repo `luiquest`**: Vite+React SPA ใน `src/` (มี `components/` เป็นจุด drop-in งานดีไซน์จากเพื่อน), functions ใน `netlify/functions/` (chat / generate-quest / pre-generate-quests + `_shared/` สำหรับ fallback chain และ supabase admin client), `supabase/schema.sql` จาก ticket 15
- **netlify.toml**: `npm run build` → `dist`, SPA fallback redirect, scheduled function cron `*/10 19-21 * * *` UTC = **ตี 2–5 เวลาไทย รันทุก 10 นาที batch เล็ก** — ออกแบบรอบ timeout ~10 วิของ function ฟรี (Background Functions 15 นาทีไม่มีในแผนฟรี ห้ามพึ่ง) → capacity ~54 generate/คืน ขยายหน้าต่าง cron ได้ฟรีถ้าผู้ใช้โต
- **Env vars 5 ตัว**: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (client ได้ ปลอดภัยเมื่อเปิด RLS), `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` + `GEMINI_API_KEY` (function เท่านั้น — กฎเหล็ก: secret ห้ามตั้งชื่อขึ้นต้น `VITE_` เพราะ Vite จะฝังลง bundle)
- **Deploy**: เชื่อม `ARCHEMETIS/luiquest` branch `main` → auto-deploy, site name `luiquest` → `luiquest.netlify.app`, rollback ผ่าน Publish deploy เก่าได้ฟรี
- **Supabase ใหม่** (region Singapore, แยกจาก ml-quest — free tier ให้ 2 โปรเจกต์พอดี) + **Google OAuth**: redirect URI ตัวจริงคือ `https://<project-ref>.supabase.co/auth/v1/callback`, Site URL = production, additional redirects ครอบ localhost:8888/5173; consent screen ใช้ scope default จึงไม่ต้องผ่าน Google verification แต่ต้องกด Publish app (โหมด Testing จำกัด 100 users)
- **Free tier ทั้งสาย**: Netlify 125k invocations / 300 build min, Supabase pause หลัง 7 วันเงียบ (cron กลางคืนกันให้), Gemini key ไม่ผูก billing = เกินโควต้าแค่ 429 ไม่มีทางเสียเงิน
