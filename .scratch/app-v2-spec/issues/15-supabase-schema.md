# ออกแบบ schema Supabase

Type: task
Status: resolved (2026-07-12)
Blocked by: 13

## Question

ออกแบบ schema Postgres/Supabase ของลุยเควสเป็นเอกสาร (ยังไม่รันจริง — implementation เป็น effort ถัดไป): ตาราง users/profiles, roadmaps ต่อหัวข้อ (cache ตลอดชีพตามผล #03), daily quests (pre-generated), progress/XP/streak, starter quests 18 ชุด (#04), referral/ลิงก์ชวนเพื่อน, leaderboard query, flag premium + จำกัด active roadmap ต่อ user (ฟรี 1 หัวข้อ), บันทึกการจ่ายเงิน/ยืนยัน PromptPay (รอผล #13), นโยบาย RLS ต่อตาราง, และช่องรองรับ Wave 2 (duo/เพื่อน, web push subscription) — ผลลัพธ์เป็นไฟล์ markdown (SQL DDL + คำอธิบาย) แนบเป็น asset

Stack ล็อกแล้วใน [สถาปัตยกรรมและ tech stack](07-tech-stack.md); บล็อกด้วย [เก็บเงินจริงใน MVP](13-real-monetization.md) เพราะโครงตารางฝั่งจ่ายเงินขึ้นกับวิธีเก็บ/ยืนยันที่เลือก

---

## Answer (2026-07-12)

Schema เต็ม (SQL DDL + คำอธิบายทุกตาราง + RLS ต่อตาราง + storage bucket + seed starter_quests โครง) อยู่ในไฟล์ asset:
**[assets/supabase-schema.md](../assets/supabase-schema.md)** — พร้อมให้ effort implement เอาไปรันได้ (จัดลำดับการรัน + จุดรีวิวไว้ท้ายไฟล์)

### ตารางทั้งหมด (14 ตาราง + 3 view + 1 bucket)

- **`profiles`** — ต่อจาก auth.users: total_xp, current/longest_streak, last_active_at, grade, **is_premium/premium_until** (#13), referral_code, referred_by, leaderboard_opt_out, is_admin, created_at (= Registered metric). สร้างอัตโนมัติด้วย trigger `handle_new_user` ดึงชื่อ/รูปจาก Google
- **`topics`** — 6 หัวข้อ curated (python/data-ml/web/ai-tools/excel/finance)
- **`roadmaps`** — ต่อ user ต่อหัวข้อ, **cache ตลอดชีพ** (unique user×topic), flag `is_active` (ฟรี 1/premium หลาย)
- **`phases`** — phase_number **integer** (คง quirk เดิม)
- **`daily_quests`** — เควส pre-generated (unique roadmap×day กันซ้ำ)
- **`quest_checklist_items`** — checklist gating
- **`quest_completions`** — มี **`completed_at`** = metric activated + กราฟเควสรายวัน (#14)
- **`starter_quests`** — คลัง 18 ชุด (unique topic×level) seed สำเร็จรูป (#04)
- **`referrals`** — track referrer↔referred + XP ทั้งคู่ (unique referred_id กันปั๊ม)
- **`chat_messages`** — แชทโค้ช (นับลิมิต 10/วันจากตารางนี้)
- **`payments`** — ตาม #13: ref_code unique, status pending→submitted→verified/rejected, slip_url, timestamps, verified_by; unique index กันจ่ายซ้อน
- **`activity_log`** — (user_id, event_type, created_at) → **DAU/กราฟโต** (#14, ตัวที่พลาดง่ายสุด)
- **`friendships`** + **`push_subscriptions`** — เตรียมไว้สำหรับ Wave 2 (duo/web push)
- **VIEW** `leaderboard`, `public_stats`, `stats_daily_growth` — aggregate (bypass RLS, 0 PII)
- **Storage bucket** `payment-slips` (private) + RLS ตาม path `{uid}/...`

### จุดออกแบบสำคัญ

- **RLS /stats**: aggregate สาธารณะทำเป็น **view** (รันด้วยสิทธิ owner → bypass RLS) เลือกเฉพาะคอลัมน์ปลอดภัย → เปิด `grant select to anon` ได้โดยไม่หลุด PII; ตารางดิบไม่เปิด public select เลย
- **RLS payments**: เจ้าของอ่าน/สร้าง/อัปสลิปแถวตัวเอง (จำกัด status ≤ submitted ด้วย WITH CHECK), **admin** อ่าน/verify ทุกแถว (helper `is_admin()`); flip is_premium ทำผ่าน service role function
- **active roadmap limit**: บังคับ 2 ชั้น — app logic (UX/upsell) + DB trigger `enforce_active_roadmap_limit` (ไม่ใช้ RLS เพราะ count เชิงเงื่อนไขแพง)
- **service role**: การเขียน is_premium/XP referral/insert daily_quests/verify payment ทำผ่าน Netlify Function ถือ service_role key (bypass RLS); RLS คือด่านกัน client (anon key)

### จุดที่ควรรีวิว (ดูรายละเอียดท้าย asset)

1. bootstrap admin คนแรก (`update ... is_admin=true`) 2. เก็บ service_role key server-side เท่านั้น 3. auto-expire premium ยังไม่ทำ (`premium_until` เก็บเฉย ๆ) 4. leaderboard/stats view — ยืนยันคอลัมน์ไม่มี PII เกิน 5. lock รายการ event_type ของ activity_log ให้ชัด
