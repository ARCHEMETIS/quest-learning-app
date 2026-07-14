# ยิง Supabase schema ขึ้นโปรเจกต์จริง

Type: task
Status: done (14 ก.ค. 2026)
Assignee: owner + claude
Blocked by: 01

## ผลลัพธ์ (14 ก.ค. 2026 — deploy สำเร็จ)

รันผ่าน SQL Editor ด้วย Chrome automation (Supabase MCP ของ plugin เปิดแค่ `features=docs` ยิง SQL ไม่ได้):

1. ✅ **Reset** ของค้าง (drop trigger on_auth_user_created + tables profiles/topics/roadmaps + 3 functions cascade)
2. ✅ **รัน `supabase/schema.sql` เต็มไฟล์ทีเดียวผ่านรวด** (บั๊ก FK forward-ref ที่แก้เมื่อ 13 ก.ค. ใช้ได้จริง)
3. ✅ **Verify ครบ:** 14 ตาราง / 3 views / RLS เปิด 14 ตาราง / 26 policies public + 2 storage = 28 / bucket `payment-slips` / trigger `on_auth_user_created` / seed 6 topics + 3 starter quests (python × 3 ระดับ)
4. ✅ **ทดสอบ RLS ด้วย anon key จริง (REST API):** profiles→`[]`, activity_log→`[]`, insert topics→42501 RLS violation, topics/starter_quests/public_stats อ่านได้ตามสเปก
5. ✅ **เจอ+ปิดจุดรั่ว:** default privileges ของ Supabase แอบให้ `anon` อ่าน view `leaderboard` ได้ (สเปกบอกเฉพาะคนล็อกอิน) → `revoke select on public.leaderboard from anon;` รันบน DB แล้ว + เพิ่มบรรทัดนี้ใน schema.sql แล้ว — ตอนนี้ anon เจอ permission denied ✓

### 🐛 บั๊กร้ายแรงที่เจอ+แก้แล้ว (14 ก.ค. ค่ำ ตอน verify ticket #10): สมัครสมาชิกไม่ได้เลยสักคน
ระหว่างเขียน+ทดสอบ `redeem-referral.js` (สร้าง test user จริงผ่าน `auth.admin.createUser`) เจอว่า **`handle_new_user()` trigger fail 100% ของเวลา** → GoTrue คืน 500 "Database error creating new user" ทุกครั้งที่มีการสมัคร (Google OAuth ก็โดนเหมือนกัน เพราะ trigger เดียวกันทำงานกับทุก insert บน `auth.users` ไม่ว่า provider ไหน)
- **สาเหตุ:** Supabase ติดตั้ง extension `pgcrypto` ไว้ที่ schema `extensions` โดย default ไม่ใช่ `public` — แต่ `handle_new_user()` รัน `set search_path = public` แล้วเรียก `gen_random_bytes()` (ตอนสุ่ม `referral_code`) แบบไม่ qualify schema → หา function ไม่เจอ → insert ลง `profiles` fail → trigger fail → ทั้ง transaction rollback (`auth.users` insert ก็หายไปด้วย)
- **ยืนยันด้วย SQL:** `select extname, extnamespace::regnamespace from pg_extension where extname='pgcrypto'` → ได้ `extensions` ไม่ใช่ `public`; และ `select count(*) from public.profiles` = 0 แถว (ยืนยันว่าไม่เคยมีใครสมัครสำเร็จเลยตั้งแต่ deploy schema)
- **แก้แล้วบน production:** `create or replace function public.handle_new_user()` เปลี่ยนเป็น `extensions.gen_random_bytes(4)` (schema-qualify) — รันผ่าน SQL Editor แล้ว + อัพเดต `supabase/schema.sql` ในโค้ดให้ตรงกันแล้ว
- **ทดสอบยืนยัน:** สร้าง test user (email/password ผ่าน `auth.admin.createUser` + `signInWithPassword`) สมัครสำเร็จ ได้ `referral_code` ปกติ — ลบ test data ออกจาก production หมดแล้ว (auth.users/profiles/referrals/activity_log กลับเป็น 0 แถวเหมือนเดิม)
- **นัยยะ:** นี่คือบั๊กที่บล็อก Destination ทั้งอันของ map (ไม่มีใครสมัครแอพได้เลย) — เจอเพราะบังเอิญทดสอบ signup path ตรง ๆ ตอนทำ ticket #10 ไม่ใช่เพราะ QA ที่วางแผนไว้; **ต้องเพิ่มเช็คนี้เข้า QA checklist ของ ticket #11** (ทดสอบสมัครจริงด้วยบัญชี Google จริงบน production ก่อนประกาศ live)

### ⬜ ค้างอย่างเดียว: bootstrap admin (ทำได้หลังล็อกอิน Google ครั้งแรก)
ตอนนี้ยังไม่มี user ใน auth.users (registered_total = 0) — หลังเจ้าของล็อกอิน Google ครั้งแรกบนแอพ ให้รัน:
```sql
update public.profiles set is_admin = true
where id = '<owner-uuid>';  -- ดู uuid ที่ Authentication → Users
```
(ผูกไว้กับ ticket 09/11 ตอน integrate + deploy จริง)

## บทเรียนสะสม
- Supabase SQL editor โชว์ error รวม/สุดท้าย — อย่าเชื่อบรรทัด ให้ไล่ทีละ chunk
- ก๊อป SQL ยาว+ไทย: `Get-Content -Raw -Encoding UTF8 ... | Set-Clipboard`
- **View ใหม่ใน public schema จะถูก default privileges เปิดให้ anon/authenticated อ่านอัตโนมัติ** — view ที่ตั้งใจให้เฉพาะบาง role ต้อง `revoke` ส่วนเกินเสมอ (view bypass RLS ด้วย จุดนี้พลาดง่าย)
- MCP ของ supabase-agent-skills plugin จำกัด `features=docs` — งาน SQL จริงใช้ SQL Editor ผ่าน browser หรือ CLI + PAT

## งานที่ต้องทำ (สเปกเดิม — ทำครบแล้ว)

รัน SQL ทั้งหมดจาก `../app-v2-spec/assets/supabase-schema.md` ขึ้น Supabase project luiquest:

- 14 ตาราง + 3 view (`/stats` เป็น VIEW สิทธิ owner เปิด anon อ่านได้ไม่หลุด PII)
- RLS ทุกตาราง (payments = เจ้าของแถว + admin verify)
- `activity_log` (user/event/created_at) — เก็บ timestamp ทุก event ตั้งแต่วันแรก
- storage bucket `payment-slips` (เตรียมไว้ แม้ freemium อยู่ Wave 2)

## เสร็จเมื่อ

ตาราง/view/RLS/bucket ขึ้นครบ ✓, query ทดสอบผ่าน ✓, ยืนยัน RLS กันการอ่านข้าม user จริง (ลอง select ด้วย anon key แล้วเห็นเฉพาะที่ควรเห็น) ✓
