# Map: สร้าง LuiQuest Wave 1 ขึ้น production

Label: wayfinder:map

## Destination

**ลุยเควส (LuiQuest) Wave 1 รันจริงบน `luiquest.netlify.app`** — ผู้ใช้จริงสมัครด้วย Google → onboarding 3 ขั้น → ได้ starter quest ทันที + roadmap เฉพาะตัว → ทำเควสรายวันได้ครบลูป (XP / streak / phase progress / letter grade / checklist gating / แชท AI โค้ช 10 ข้อความ/วัน) + กลไกโต Wave 1 (ลิงก์ชวนเพื่อน, leaderboard, การ์ดแชร์ streak, หน้า /stats สาธารณะ) ติดตั้งเป็น PWA ได้ทั้งมือถือและ iPad

ถึงจุดหมายเมื่อ: คนแปลกหน้าเปิดลิงก์แล้วสมัคร-ทำเควส-ได้ XP ได้จริงบน production โดยไม่พัง และเก็บ timestamp ทุก event ตั้งแต่วันแรก (สำหรับกราฟโตไว้ pitch)

## Notes

- **⚙️ map นี้เป็น execution map — carries execution:** override ค่า default ของ wayfinder ("วางแผนเฉย ๆ") ticket ส่วนใหญ่คือ **ลงมือทำจริง** (ตั้ง Supabase, เขียน functions, เสียบ UI, deploy) ไม่ใช่แค่ตัดสินใจ — Claude Code + เจ้าของ ทำด้วยกันในแต่ละ session
- **แหล่งความจริงเดียว = สเปกที่ปิดแล้ว:** ทุกการตัดสินใจ (positioning, ฟีเจอร์, schema, deploy, โมเดล AI, แหล่งเรียน) ล็อกไว้ใน [`../app-v2-spec/spec.md`](../app-v2-spec/spec.md) + assets: `supabase-schema.md`, `deploy-plan.md`, `thai-lesson-sources.md`, `design-brief-ui.md` — **อ่านก่อนทำเสมอ ห้าม re-decide**; ถ้าเจอช่องที่สเปกไม่ได้ตอบ ค่อยแตกเป็น ticket ตัดสินใจ (กรณีหายาก)
- **ทีม:** เจ้าของ + Claude Code เขียนโค้ด; **เพื่อนส่ง UI เป็น React components ครบ 10 หน้า** (ตาม `design-brief-ui.md`) — งานเราคือ wiring (auth/state/API/logic) ไม่ต้องออกแบบ UI ใหม่
- **ข้อจำกัดตายตัว:** ฝั่งต้นทุน free tier เท่านั้น (Supabase free / Netlify free / Gemini free) — โมเดล `gemini-3-flash` (งานหนัก) + `flash-lite` (แชท) + fallback chain; ภาษาแอพเป็นไทย
- **โค้ดอ้างอิง:** `ml-quest/` (เดิม) — ก๊อปแพตเทิร์น Netlify Function + การต่อ Supabase/Gemini ได้
- **Skills ที่ควรใช้:** `/verify` ยืนยันแต่ละ ticket ทำงาน end-to-end จริง, `/run` เปิดแอพดู; `/grilling` และ `/domain-modeling` ยังไม่ติดตั้ง → ทำ Q&A เองทีละคำถาม
- **เวลา:** เป้าเปิด Wave 1 ~2 สัปดาห์; นำเสนออาจารย์ ~9 ส.ค. 2026
- **Tracker:** local markdown (`.scratch/build-wave1/`) — map นี้แยกจาก map วางแผน (`app-v2-spec/`) ที่ปิดแล้ว

## Decisions so far

<!-- one line per closed ticket: gist + link -->

- **03 schema ขึ้น production แล้ว (14 ก.ค.):** 14 ตาราง + 3 views + RLS 28 policies + bucket + seed ครบ, ทดสอบ anon key ผ่าน, ปิดจุดรั่ว leaderboard (revoke anon) — ค้างแค่ bootstrap admin หลังล็อกอินครั้งแรก → [issues/03-deploy-schema.md](issues/03-deploy-schema.md)
- **04 starter quests 18 ชุด seed เข้า production แล้ว (14 ก.ค.):** เขียนเนื้อหาไทยครบ 6 หัวข้อ × 3 ระดับ, ลิงก์ทั้งหมดมาจาก thai-lesson-sources.md, เช็ค 200 ครบ, seed ผ่าน `npm run seed:starter-quests` (supabase-js upsert, ไม่ต้องใช้ SQL Editor) — กำหนด shape `content`/`checklist` เองเพราะสเปกเดิมไม่ได้ล็อก (ดูรายละเอียดใน ticket) → [issues/04-seed-starter-quests.md](issues/04-seed-starter-quests.md)
- **05-08 backend เต็มระบบเสร็จแล้ว (14 ก.ค., commit `2f67f74`):** whitelist/roadmap-outline config (`_shared/curatedContent.js`), core game-loop functions (`me`/`start-roadmap`/`quest-today`/`complete-quest` — auth check, checklist gating, XP/streak/grade, activity_log), Gemini fallback chain จริง (`_shared/gemini.js`: `gemini-3-flash-preview` → `gemini-2.5-flash-lite` → `gemini-2.5-flash` → static, RPM retry/RPD skip, JSON schema output — ชื่อโมเดลจริงต่างจาก placeholder ในสเปก ยังไม่ได้เช็คโควต้าจริงกับ AI Studio dashboard ตาม #11.A.4), freeform roadmap generation + coach chat (`generate-quest.js`/`chat.js`), nightly scheduled pre-generate (`pre-generate-quests.js`, ไม่มี queue table ใหม่ คำนวณ eligibility สดจาก roadmaps/daily_quests/quest_completions ทุกรอบ) — ยิง `/verify` ผ่าน `netlify dev` จริงกับ production Supabase (auth gating ถูก, `pre-generate-quests` ต่อ DB จริงสำเร็จ) + code review 8 มุม เจอ 10 findings แก้แล้ว 4 ตัวที่คุ้ม (Gemini ยิงก่อนเช็ค limit ฟรี, checklist insert error ที่ทำให้ gating ผ่านฟรี, race บน complete-quest, error `.code` ไม่หลุดถึง frontend) เหลือ 6 ตัวเป็น known follow-up (SCAN_LIMIT 60 ไม่หมุนเวียนถ้า active roadmap เกิน 60, chat degraded ทิ้ง history ไม่ครบคู่ ฯลฯ) → [issues/05-seed-roadmaps-sources.md](issues/05-seed-roadmaps-sources.md) [issues/06-core-functions.md](issues/06-core-functions.md) [issues/07-ai-pipeline.md](issues/07-ai-pipeline.md) [issues/08-scheduled-pregenerate.md](issues/08-scheduled-pregenerate.md)
- **09 UI เริ่มมาบางส่วน (14 ก.ค. ค่ำ):** เพื่อนส่ง 4/10 หน้าผ่าน GitHub PR (`frontend/add-ui-components`) — Login, Onboarding 3 ขั้น, เควสรายวัน, แชทโค้ช + mascot/logo — คุณภาพตรง design brief, `npm run build` ผ่าน. **เจอ+แก้ปัญหา sync:** local repo ไม่เคย push เกิน commit "Add CONTRIBUTING.md" มานาน ทำให้เพื่อน branch PR จากจุดเก่า เกิด diverged history → merge local คืน origin/main สำเร็จไม่มี conflict + push แล้ว (`750ee86`) — **บทเรียน: push บ่อยขึ้นหลังงานสำคัญเสร็จ เพราะเพื่อนทำงานผ่าน GitHub PR ไม่ใช่ไฟล์ส่งตรง**. ยังขาด Leaderboard/ชวนเพื่อน/การ์ดแชร์ streak/stats/app shell (6 หน้า) — backend พร้อม wiring 4 หน้าที่มีได้ทันที ไม่ต้องรอที่เหลือ → [issues/09-integrate-ui.md](issues/09-integrate-ui.md)
- **09 wiring 4 หน้าแรกเสร็จ (14 ก.ค. ดึก, commit `9f08d0f` push แล้ว):** ลูปเต็ม login Google → onboarding → เควส → เคลม XP → ฉลอง → แชทโค้ช เดินได้จริง ยืนยันด้วยเบราว์เซอร์จริงกับ production Supabase/Gemini. เพิ่ม `AuthProvider` context, `useProfile` hook, `topics.js` mapping, route `/coach` + auth guard. Code review 8 มุมเจอ+แก้บั๊กจริง 5 ตัว (auth redirect loop, ฉากฉลองโดน reset, ประวัติแชทเรียงผิดทำโควต้าเพี้ยน, state "streak ขาด" unreachable, /me ล้มเหลวเด้ง onboarding ผิด) — รายละเอียด+known follow-ups ใน ticket. **ticket ยังเปิด:** เหลือ wiring 6 หน้าที่เพื่อนยังไม่ส่ง → [issues/09-integrate-ui.md](issues/09-integrate-ui.md)
- **10 growth features บางส่วน (14 ก.ค. ค่ำ):** สร้าง `redeem-referral.js` (ชิ้นเดียวของ ticket 10 ที่ไม่ติด UI) — แจก XP ชวนเพื่อนทั้งคู่ผ่าน service role, กัน self-invite/double-redeem/race แล้ว ทดสอบ 13/13 ผ่านจริงกับ production. **เจอบั๊กร้ายแรงระหว่างทดสอบ: `handle_new_user()` trigger fail 100% มาตั้งแต่ deploy schema (ไม่มีใครสมัครแอพได้เลยสักคน รวม Google OAuth)** — สาเหตุ `pgcrypto` อยู่ schema `extensions` ไม่ใช่ `public` แต่ trigger เรียก `gen_random_bytes()` แบบไม่ qualify → แก้แล้วบน production + schema.sql (`extensions.gen_random_bytes`) → [issues/03-deploy-schema.md](issues/03-deploy-schema.md). Leaderboard/stats/streak-card ที่เหลือเป็น UI wiring ล้วน (query view ตรงผ่าน `supabaseClient.js` ไม่ต้องมี Function ใหม่) — รอ ticket 09 → [issues/10-growth-features.md](issues/10-growth-features.md)

## Not yet specified

<!-- หมอกที่ยังชี้ไม่ชัด รอ frontier ขยับ -->

- **แผน QA/verify ก่อนปล่อย** — เช็คลิสต์ทดสอบ manual + edge states ก่อน announce (จะชัดเมื่อ integration ใกล้เสร็จ)
- **แนวทาง error handling/logging กลางของ Netlify Functions** — จะชัดตอนเขียน function ชุดแรก
- **การจูนรางวัล XP ของลิงก์ชวนเพื่อน** (กันโกง/ปั๊มบัญชี) — รอเห็นพฤติกรรมจริง

## Out of scope

<!-- เกินจุดหมาย Wave 1 — เป็น effort ใหม่ถ้าจะทำ -->

- **ฟีเจอร์ Wave 2** — web push, ระบบเพื่อน/duo, ชั้นจ่ายเงิน freemium PromptPay 39฿ (ticket #13 เดิม) — effort ถัดไปหลัง Wave 1 มียอดผู้ใช้
- **ห่อ Play Store (TWA/Capacitor) / App Store** — หลัง PWA-first พิสูจน์ยอดแล้ว
- **สไลด์ pitch ปลายเทอม** — งานแยกหลังแอพมีตัวเลขผู้ใช้
