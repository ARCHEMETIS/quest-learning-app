# สเปกฉบับสมบูรณ์ — ลุยเควส (LuiQuest)

> **สถานะ:** พร้อมส่งต่อ effort ถัดไป (ลงมือสร้าง) — รวบทุกการตัดสินใจจาก ticket #01–#16 ที่ปิดแล้ว (12 ก.ค. 2026)
> **นี่คือ Destination ของแผน** `app-v2-spec` — จากจุดนี้ไปคือการเขียนโค้ดจริง ไม่ใช่การตัดสินใจใหม่
> เอกสารนี้อ้างอิง asset เชิงลึก 5 ไฟล์ใน `assets/` (schema เต็ม, deploy, แหล่งเรียน, design brief, quota research) — ไม่ก๊อปมาทั้งหมด ให้เปิดตามลิงก์

**Source of truth ต่อหัวข้อ:** ทุก section ระบุ ticket ต้นทางในวงเล็บ เช่น (#06) → เปิด `issues/06-mvp-features.md` ดูเหตุผลเต็ม

---

## 1. ภาพรวม & Positioning

**ลุยเควส (LuiQuest)** — แอพเรียนรู้แบบเควสรายวัน ภาษาไทย ที่เปลี่ยน "อยากเก่งอะไรสักอย่าง" ให้เป็นเส้นทางเรียนจากแหล่งฟรีภาษาไทยที่คัดมาแล้ว แล้วพาไปต่อวันละเควสจนเก่งจริง (multi-user + multi-topic) (#05)

- **Tagline:** "อยากเก่งอะไร ลุยเลย — วันละเควส"
- **โทนแบรนด์:** สนุก เป็นกันเองแบบไทย ๆ มุก/meme ได้ เหมาะกับการแชร์ในกลุ่มมหาลัย; คงกลไกเกม quest/XP/streak แต่ไม่เล่นคำ RPG จ๋า (ไม่มี "ท่านนักผจญภัย") (#05)
- **ชื่อโรมัน:** `luiquest` → repo `ARCHEMETIS/luiquest`, URL `luiquest.netlify.app`

**Value Proposition (จาก #08, เวอร์ชัน pitch):**
> "อยากเก่งอะไร ลุยเลย — ลุยเควสเปลี่ยนเป้าหมายของคุณให้เป็นเส้นทางเรียนจากแหล่งฟรีภาษาไทยที่คัดมาแล้ว แล้วพาไปต่อวันละเควส 15–30 นาทีด้วย streak/XP จนเก่งจริง แก้ทั้ง 'ไม่รู้จะเริ่มตรงไหน' และ 'เริ่มแล้วไม่รอด' ในแอพเดียว"

แก้ 2 pain พร้อมกัน: **ไม่รู้เริ่มตรงไหน** (AI จัด roadmap จากแหล่งไทยคัดแล้ว 24 โดเมน) + **เริ่มแล้วไม่รอด** (เควสรายวัน 15–30 นาที + streak/XP/leaderboard + แชทโค้ช) จุดต่างจากคอร์สออนไลน์/YouTube: ไม่ใช่ "กองคอนเทนต์" แต่เป็น "เส้นทาง + แรงผลักให้ทำต่อทุกวัน" ภาษาไทย เข้าจากลิงก์ได้ทันที (PWA)

**กลุ่มเป้าหมาย (#01):**
- **ตลาดกว้าง:** คนไทยวัยเรียน–วัยเริ่มทำงานที่อยากอัพสกิลด้วยตัวเองแต่ล้มเลิกกลางทางบ่อย
- **Beachhead (ยิงก่อน):** นักศึกษาไทยสายไอที/วิศวะ/วิทย์รอบตัวเจ้าของ — เอื้อมถึงได้จริงใน 2–3 สัปดาห์แรก, มี Gmail ทุกคน, ใช้มือถือเป็นหลัก
- **นัยยะ:** การโตหลัก = ปากต่อปาก → แอพต้องมี mechanic ชวนเพื่อน/แชร์ในตัว; หัวข้อสายเทค (Python, Data/ML, เว็บ) โชว์เด่นบนสุด

**บริบทวิชา:** เป็นโปรเจกต์วิชาธุรกิจ คะแนนวัดจาก **จำนวนผู้ใช้จริง** ("ยิ่งเยอะยิ่งดี" ไม่มีเป้าตัวเลข) เดดไลน์จริง = 1 เทอม แต่ยึดเป้าเปิดตัว Wave 1 ใน ~2 สัปดาห์ + นำเสนออาจารย์ครั้งถัดไป ~9 ส.ค. 2026 (ต้องมี BMC + ตัวเลขผู้ใช้จริง)

---

## 2. ขอบเขตผลิตภัณฑ์

### 2.1 หัวข้อเรียน (#02)

โครงสร้าง: **Curated 6 หัวข้อเป็นแกน + พิมพ์หัวข้ออิสระได้**

| slug | หัวข้อ | โน้ต |
|---|---|---|
| `python` | Python เริ่มจากศูนย์ | สายเทค โชว์เด่น |
| `data-ml` | Data/ML | ยก roadmap Kaggle จาก ml-quest เดิม |
| `web` | สร้างเว็บ (HTML/CSS/JS) | สายเทค โชว์เด่น |
| `ai-tools` | ใช้ AI ให้เป็น | ทักษะทำงาน |
| `excel` | Excel/Google Sheets | ทักษะทำงาน |
| `finance` | การเงินส่วนบุคคล | แหล่งไทยเยอะ |

- **ภาษาแหล่งเรียน:** ไทยก่อน อังกฤษเสริม; ตัวเควส/คำอธิบาย/Quest Coach เป็นไทยเสมอ
- **Guardrail โหมดพิมพ์อิสระ:** AI เขียนเนื้อเควสเองได้เต็มที่ แต่ลิงก์ที่แนบได้มีแค่ 2 แบบ — (ก) หน้าหลักของโดเมนใน whitelist (ข) ลิงก์ค้นหา (YouTube/Google search URL) **ห้ามแต่ง deep URL เด็ดขาด** (บทเรียนจาก ml-quest ที่ Gemini แต่ง URL ไม่มีจริง)
- แหล่งเรียนจริง + whitelist 24 โดเมน + โครงบทเรียนต่อหัวข้อ: ดู **[assets/thai-lesson-sources.md](assets/thai-lesson-sources.md)** (#12)

### 2.2 ฟีเจอร์ MVP แบ่ง Wave (#06)

**ยกจาก ml-quest เดิมทั้งหมด (ไม่ตัด):** XP, streak รายวัน, phase progress, letter grade, แชท AI โค้ช (จำกัด 10 ข้อความ/วัน), checklist gating (ติ๊กครบถึงได้ XP), PWA ติดตั้งได้

**Wave 1 — เปิดตัว (~2 สัปดาห์):**
- แกนเดิมทั้งหมด + onboarding/starter quests 18 ชุด
- **ลิงก์ชวนเพื่อน** (สมัครผ่านลิงก์ → นับยอด + ให้ XP ทั้งคู่)
- **Leaderboard** อันดับ XP รวมทั้งแอพ
- **การ์ดแชร์ streak** (ภาพสำหรับโพสต์ IG story/LINE)
- **หน้า /stats สาธารณะ** (ยืนยันเพิ่มจาก #14 — ดู section 7)

**Wave 2 — หลังเปิดตัว ระหว่างหาผู้ใช้:**
- **Web push** กัน streak ขาด (ฟรีผ่าน PWA; iOS ต้อง add to home screen ก่อน)
- **ระบบเพื่อน/duo** (เห็น streak กันและกัน)
- **ชั้นจ่ายเงิน freemium** (premium 39 บาท/เดือน — ดู section 6)

**Multi-topic = เส้นแบ่งฟรี/จ่ายเส้นแรก:** ฟรี = active roadmap ทีละ 1 หัวข้อ, premium = หลายหัวข้อพร้อมกัน (ช่วยประหยัดโควต้า Gemini + โฟกัสดีกับมือใหม่)

### 2.3 สิ่งที่ตัดออก / ตั้งใจไม่ทำ

- **ไม่มี guest/anonymous login** — Google-only (#04)
- **ไม่ขายหัวข้อพิเศษ/เนื้อหา exclusive** — ทุกหัวข้อฟรีหมด ต่างกันแค่ "เรียนพร้อมกันได้กี่หัวข้อ" (#13)
- **ไม่กั้น leaderboard/ชวนเพื่อน/แชร์ ไว้หลัง paywall** — พวกนี้คือเครื่องยนต์การโต ต้องฟรี 100% (#13)
- **ไม่มี tier ราคาย่อย** — ราคาเดียว 39 บาท/เดือน (ลด complexity ของ manual verification) (#13)
- **App Store พักไว้** ($99/ปี + ต้องมี Mac) — ขัดข้อจำกัดงบศูนย์ (#07)
- **ไม่แตะ ml-quest เดิม** — เก็บเป็น portfolio; ใช้เป็นโค้ดอ้างอิง/ก๊อปชิ้นส่วนได้

---

## 3. User Flow

### 3.1 Login & Onboarding (#04)

- **ล็อกอิน:** Google Sign-in ผ่าน Supabase Auth **อย่างเดียว** — ไม่มี guest, ไม่มี email+password, ไม่ต้องยืนยันอีเมล (Google ยืนยันมาแล้ว) → ทุกบัญชีนับเป็น "ผู้ใช้จริง" โชว์อาจารย์ได้ชัด
- ชื่อ/รูปโปรไฟล์ดึงจาก Google อัตโนมัติ ไม่ถามซ้ำ
- **Onboarding 3 ขั้น จบใน <1 นาที:** (1) เลือกหัวข้อ (6 curated หรือพิมพ์อิสระ) → (2) ระดับพื้นฐาน (มือใหม่/พอมีพื้น/แน่น) → (3) เวลาว่างต่อวัน (15/30/60 นาที) → เจอเควสแรกทันที (ไม่ถามเป้าหมาย/สไตล์การเรียน เพื่อลด friction)
- **เควสแรก = starter quest สำเร็จรูป** จากคลัง 18 ชุด (6 หัวข้อ × 3 ระดับ) เก็บใน Supabase → ขึ้นทันที 0 วินาที ไม่กินโควต้า Gemini; roadmap เฉพาะตัวเต็ม generate เบื้องหลัง/รอบกลางคืน
- **ข้อยกเว้น:** หัวข้อพิมพ์อิสระ generate สดพร้อมหน้ารอ (~5–20 วิ) — ส่วนน้อย ยอมรับได้

### 3.2 วงจรใช้งานหลัก (Wave 1)

- **เควสรายวัน (หน้าหลัก):** เควสวันนี้ (ชื่อ + คำอธิบาย + ลิงก์แหล่งเรียน) + checklist gating (ติ๊กครบทุกข้อถึงได้ XP) + แถบสถานะ (XP สะสม, streak, phase progress %, letter grade) + ทางเข้าแชทโค้ช
- **แชทโค้ช AI:** จำกัด 10 ข้อความ/คน/วัน (ฟรี); ครบแล้วขึ้น contextual upsell (Wave 2) + บอกรีเซ็ตเที่ยงคืน
- **Leaderboard:** อันดับ XP รวมทั้งแอพ, แถวตัวเอง highlight/pin ให้หาเจอง่าย, โชว์ badge premium (Wave 2)
- **ชวนเพื่อน:** ลิงก์ชวนส่วนตัว + ปุ่ม copy/แชร์ (LINE/IG) + อธิบายรางวัล (สมัครผ่านลิงก์ = XP ทั้งคู่) + ยอดเพื่อนที่สมัครแล้ว
- **การ์ดแชร์ streak:** การ์ดภาพแนวตั้ง 9:16 สำหรับ IG story — streak เด่น + ชื่อผู้ใช้ + แบรนด์ + ลิงก์ชวน (= "โฆษณาที่ผู้ใช้ทำให้ฟรี"); ปุ่มแชร์ควรแนบลิงก์ชวนอัตโนมัติ + ดันให้แชร์ตอน streak สวย (3, 7 วัน)
- **/stats สาธารณะ:** หน้าโชว์การเติบโต (ดู section 7)

รายละเอียดทุกหน้า + edge states: ดู section 10 และ **[assets/design-brief-ui.md](assets/design-brief-ui.md)**

---

## 4. สถาปัตยกรรม & Tech Stack (#07)

### 4.1 Stack ที่ล็อก

- **Frontend:** Vite + React (JSX) + Tailwind CSS + React Router — SPA; รับงานดีไซน์จากเพื่อน (Claude artifacts เป็น React+Tailwind) แบบแทบ copy-paste
- **PWA:** ผ่าน `vite-plugin-pwa` — ติดตั้งได้ทั้งมือถือ/iPad; **responsive บังคับ** (mobile-first + tablet/iPad breakpoints)
- **Backend:** Netlify Functions + Netlify Scheduled Function + Supabase (Postgres + Auth + RLS)
- **Cache layer:** Supabase — roadmap cache ตลอดชีพ, เควสรายวัน pre-generate ลงตาราง; กลางวัน frontend อ่านผ่าน function ล้วน ไม่แตะ Gemini

### 4.2 กลยุทธ์โควต้า AI (#03)

**บริบท:** Google ไม่ประกาศตัวเลขสาธารณะแล้ว — ตัวเลขจริงดูใน AI Studio dashboard เท่านั้น (เช็ค 5 นาทีตอนเริ่ม implement). Planning number: `gemini-3-flash` ~1,500 RPD, `flash-lite` ~1,000, `2.5-flash` ~250 (เลิกใช้เป็นตัวหลัก); RPM ทุกตัว ~10–15. **จุดตายคือ RPM ไม่ใช่ RPD**

**4 กลยุทธ์:**
1. **Pre-generate + cache** (ตัวคูณใหญ่สุด): roadmap generate ครั้งเดียวต่อ user×topic เก็บตลอดชีพ; เควสรายวัน pre-generate ตอนกลางคืนด้วย Scheduled Function เกลี่ยข้ามช่วง → กลางวันอ่าน DB ล้วน; ทุก generate ต้อง idempotent
2. **แบ่งงานตามโมเดล:** roadmap/เควส → `gemini-3-flash`, แชท → `gemini-2.5-flash-lite` (ถังโควต้าแยกกัน)
3. **จำกัดแชท 10 ข้อความ/คน/วัน** (นับใน Supabase, บังคับใน Netlify Function ก่อนเรียก Gemini)
4. **Fallback chain:** `3-flash` → `flash-lite` → `2.5-flash` → static fallback (เควสสำเร็จรูป) + exponential backoff + jitter (ห้าม retry ทันที)

**Capacity:** ~250–330 active users/วัน (chain เดียว) ถึง ~500–600 (เต็ม chain) — เหลือเฟือสำหรับเป้าวิชานี้. ความเสี่ยงเดียว = Google หั่นโควต้าอีก ซึ่ง fallback ปิดแล้ว

> **สำคัญ:** โมเดลหลักย้ายจาก `gemini-2.5-flash` (ที่ ml-quest เดิมใช้) ไป `gemini-3-flash` + `flash-lite` — memory note "ใช้ gemini-2.5-flash" เป็นของ ml-quest เดิม ไม่ใช่แอพนี้

รายละเอียดเต็ม + capacity math: **[assets/gemini-quota-research.md](assets/gemini-quota-research.md)**

### 4.3 แหล่งบทเรียน (#12)

แหล่งฟรี 4–5 แหล่ง/หัวข้อ (ไทยแกน อังกฤษเสริม) + whitelist 24 โดเมน + pattern ลิงก์ค้นหา + โครงบทเรียนต่อหัวข้อ — ทุก URL เช็ค HTTP 200 จริง (12 ก.ค. 2026). asset นี้เป็นข้อมูลตั้งต้นของ starter quests 18 ชุด + ค่าคงที่ whitelist ใน generate-quest

ระวัง: **aommoney.com ห้ามใส่ www**, Chula MOOC เปิดรับเป็นรอบ, SET e-Learning ต้องสมัครสมาชิกฟรีก่อน. ตัดออก: ThaiMOOC (ย้ายแพลตฟอร์ม), 1213.or.th (ล่ม), SkillLane/FutureSkill/Udemy (จ่ายเงิน)

รายละเอียด: **[assets/thai-lesson-sources.md](assets/thai-lesson-sources.md)**

---

## 5. Data Model (#15)

Schema Postgres/Supabase — **14 ตาราง + 3 view + 1 storage bucket**. SQL DDL เต็ม + RLS ต่อตาราง + seed + ลำดับการรัน: **[assets/supabase-schema.md](assets/supabase-schema.md)**

**หลักการออกแบบ:**
- `id` เป็น `uuid` ทุกตารางที่ผูกกับผู้ใช้ (ยกเว้น `activity_log`/`chat_messages` ใช้ `bigint identity` — append-only ปริมาณสูง)
- `phase_number` เป็น `integer` (คง quirk เดิม)
- **timestamp ต่อ event ตั้งแต่วันแรก** — ทุกตาราง metric มี `created_at`/`completed_at`/`submitted_at`/`verified_at` (ถ้าลืม จะทำกราฟโตตอน pitch ไม่ได้)
- **RLS เปิดทุกตาราง** — ทุก query ผูกกับ `auth.uid()`
- **Aggregate สาธารณะ (/stats) + leaderboard = VIEW** (รันด้วยสิทธิ owner → bypass RLS → เปิด aggregate ได้โดยไม่หลุด PII)
- **การเขียนที่ผู้ใช้ห้ามทำเอง** (flip `is_premium`, ให้ XP referral, verify payment, insert daily_quests) ทำผ่าน **Netlify Function ที่ถือ service_role key** (bypass RLS); RLS คือด่านกัน client (anon key)

**ตารางหลัก:**

| ตาราง | หน้าที่ | Wave |
|---|---|---|
| `profiles` | XP/streak/grade/is_premium/premium_until/last_active_at/referral_code/is_admin/created_at | 1 |
| `topics` | 6 หัวข้อ curated | 1 |
| `roadmaps` | roadmap ต่อ user×topic (cache ตลอดชีพ) + flag `is_active` | 1 |
| `phases` | phase_number integer | 1 |
| `daily_quests` | เควส pre-generated (unique roadmap×day) | 1 |
| `quest_checklist_items` | checklist gating | 1 |
| `quest_completions` | **completed_at** = metric activated + กราฟเควสรายวัน | 1 |
| `starter_quests` | คลัง 18 ชุด (unique topic×level) | 1 |
| `referrals` | referrer↔referred + XP ทั้งคู่ (unique referred_id กันปั๊ม) | 1 |
| `chat_messages` | แชทโค้ช (นับลิมิต 10/วัน) | 1 |
| `payments` | ref_code unique, status pending→submitted→verified/rejected, slip_url, timestamps | 2 |
| `activity_log` | (user_id, event_type, created_at) → **DAU/กราฟโต** (ตัวที่พลาดง่ายสุด) | 1 |
| `friendships` / `push_subscriptions` | เตรียม Wave 2 | 2 |
| VIEW `leaderboard` / `public_stats` / `stats_daily_growth` | aggregate (bypass RLS, 0 PII) | 1 |
| Storage `payment-slips` | private + RLS ตาม path `{uid}/...` | 2 |

**การบังคับ active roadmap limit (ฟรี 1/premium หลาย):** 2 ชั้น — app logic (UX/upsell) + DB trigger `enforce_active_roadmap_limit` (ไม่ใช้ RLS เพราะ count เชิงเงื่อนไขแพง)

---

## 6. โมเดลธุรกิจ & การเก็บเงิน (#08 + #13)

### 6.1 BMC 9 ช่อง (เวอร์ชัน pitch — premium 39 บาท/เดือน)

1. **Customer Segments** — ตลาดกว้าง: คนไทยวัยเรียน–วัยเริ่มทำงานที่อยากอัพสกิลแต่ล้มเลิกบ่อย; **beachhead:** นักศึกษาไทยสายไอที/วิศวะ/วิทย์รอบตัวเจ้าของ; ผู้จ่ายเงิน = subset ของ beachhead ที่ติดใจ
2. **Value Proposition** — ควบ 2 pain (ไม่รู้เริ่มตรงไหน + เริ่มแล้วไม่รอด) ผ่าน AI roadmap จากแหล่งไทย + เควสรายวัน + streak/XP/leaderboard/แชทโค้ช (ดู section 1)
3. **Channels** — ปากต่อปากในตัวแอพ: ลิงก์ชวนเพื่อน (XP ทั้งคู่), การ์ดแชร์ streak, โพสต์กลุ่มมหาลัย; แจกเป็น PWA เข้าจากลิงก์ได้ทันที; ช่องจ่ายเงิน = PromptPay QR + อัปสลิปในแอพ
4. **Customer Relationships** — self-serve เต็มรูป + ผูกใจด้วยกลไกเกม (streak/leaderboard/duo) + AI โค้ชส่วนตัว; การจ่ายเงินกึ่ง manual = มี touch point กับผู้จ่ายจริงช่วงต้น (ดีต่อ feedback/pitch)
5. **Revenue Streams** — **ทางเดียว: Premium 39 บาท/เดือน ผ่าน PromptPay QR ยืนยันกึ่ง manual**; ปลดล็อกหลายหัวข้อพร้อมกัน + แชทโค้ชไม่จำกัด; ชั้นฟรีต้องสนุกพอไม่ฆ่ายอดผู้ใช้; recurring จริงที่สังเกตรอบ renew ได้ในกรอบเวลาวิชา (ข้อแลก: verify manual รายเดือน + auto-expire runway สั้น)
6. **Key Resources** — asset แหล่งบทเรียนไทยคัดแล้ว (คูเมือง), ระบบประหยัดโควต้า Gemini, Supabase/Netlify/Gemini free tier, แรงงาน (เจ้าของ + Claude Code + เพื่อนออกแบบ UI), บัญชี PromptPay เจ้าของ
7. **Key Activities** — พัฒนาแอพ Wave 1→2, คัด/ดูแลแหล่งเรียน, เฝ้าโควต้า AI, ปั้น viral loop, ยืนยันการจ่ายเงินกึ่ง manual, อัพเดตอาจารย์
8. **Key Partners** — ไม่มีสัญญาจริง; ในช่องใส่: ผู้ให้บริการ free tier (Google Gemini, Supabase, Netlify), เจ้าของแหล่งบทเรียนฟรี (ลิงก์ไป ไม่ host), เพื่อนนักออกแบบ, ผู้ให้บริการ PromptPay/ธนาคาร
9. **Cost Structure** — เงินสด ≈ 0 บาท (free tier ทั้งหมด + PromptPay บุคคลไม่มีค่าธรรมเนียม) ต้นทุนจริงคือเวลา; **ต้นทุนต่อผู้ใช้ ≈ 0 → รายได้ premium เกือบทั้งหมดคือ margin** (จุดขายเด่นใน pitch); scale story: โตเกิน free tier ค่อยจ่าย Supabase Pro/Gemini paid ด้วยรายได้ premium ที่เข้ามาก่อน

**Revenue story สำหรับ pitch:** "เปิดตัวฟรี → โตด้วยปากต่อปาก → เปิด premium 39 บาท/เดือนผ่าน PromptPay ใน Wave 2 → ถึงวัน pitch มีตัวเลขจริง 2 ตัว: ผู้ใช้ N คน + ผู้จ่ายจริง M คน" — conversion เป้า 2–5% ของ active users พอพิสูจน์ willingness-to-pay

### 6.2 เส้นแบ่งฟรี/จ่าย (#13)

**ชั้นฟรี (ครบและสนุกในตัวเอง):** active roadmap 1 หัวข้อ (สลับได้ progress ไม่หาย) + เควสรายวันเต็มรูป + XP/streak/phase/grade + แชทโค้ช 10 ข้อความ/วัน + ฟีเจอร์ viral ครบ (ลิงก์ชวน/leaderboard/การ์ดแชร์ — ฟรี 100%) + web push (Wave 2)

**ชั้น premium (39 บาท/เดือน) ปลดล็อก:**
1. **หลายหัวข้อพร้อมกัน** (active roadmap หลายอันขนาน) — จุดขายหลัก
2. **แชทโค้ช AI ไม่จำกัด** (ทะลุเพดาน 10/วัน) — จุดขายรอง แต่ trigger บ่อยสุด; แนะนำ soft cap ~100/วัน กัน abuse
3. **Badge "Premium"** ข้างชื่อบน leaderboard/การ์ดแชร์ — ต้นทุน 0 + social proof

### 6.3 Flow เก็บเงิน PromptPay (งบศูนย์, กึ่ง manual)

1. ผู้ใช้กด trigger จุดขาย (เพิ่มหัวข้อที่ 2 / แชทครบ 10) → หน้า Premium
2. กด "สมัคร Premium" → สร้าง payment record `pending` + **ref_code ไม่ซ้ำ** (`LQ-XXXX`)
3. แสดง **PromptPay QR** (generate ฝั่ง client จาก payload EMVCo มาตรฐาน ด้วยเบอร์/เลขบัตร ปชช.พร้อมเพย์ของเจ้าของ — ไม่ใช้ API เสียเงิน) จำนวน 39 บาท + โชว์ ref code
4. ผู้ใช้โอน → **อัปโหลดสลิป** → record เป็น `submitted` (+ slip_url ใน Supabase Storage) — ยังใช้ฟรีต่อได้ระหว่างรอ
5. **เจ้าของ** เปิดหน้า admin (list `submitted`) → ดูสลิป + ref → เทียบยอดเข้า PromptPay จริงด้วยตา → กด **Verify** → set `is_premium=true` + `premium_until` (atomic ผ่าน service role function) / หรือ **Reject** + เหตุผล
6. gating เช็ค `is_premium` ที่จุดขายหลัก (เพิ่มหัวข้อที่ 2) + เพดานแชท

**กฎเหล็ก paywall:** onboarding → เควสแรก **ต้องไม่เจอ paywall แม้แต่นิดเดียว**; ทุก trigger เป็น soft (ปัดทิ้งได้ ใช้ฟรีต่อได้ไม่จำกัดครั้ง); entry point ถาวร = ปุ่ม Premium ในหน้าโปรไฟล์

**Scope ขั้นต่ำก่อน pitch (Wave 2 fast-follow):** payment table + หน้า Premium + QR + ref code + อัปสลิป + gating 1 จุด + หน้า admin verify/reject. เป้า: M ≥ ~3–5 คนจ่ายจริง. **ตัด/เลื่อนได้:** auto-expire cron, slip-verify อัตโนมัติ, milestone upsell, badge (ถ้าเวลาบีบ)

---

## 7. Metric & การวัดผู้ใช้จริง (#14)

### 7.1 นิยาม "ผู้ใช้จริง" — รายงาน 2 ระดับ

- **Registered** = ทุกบัญชี Google ที่สมัคร (นับแถว `profiles`/`auth.users`) — สะอาดอยู่แล้วเพราะ Google-only
- **Activated** = บัญชีที่ทำเควสสำเร็จ **≥ 1 อัน** (มีแถวใน `quest_completions`) — **ตัวหลักที่ชูในรายงาน** เพราะสื่อ engagement จริง + กันข้อครหา "ปั๊มยอดจากเพื่อนที่กดสมัครทิ้ง"
- รายงานควบกัน: "สมัครแล้ว N คน, ใช้งานจริง M คน" + Activation rate (M÷N)

### 7.2 หน้า /stats สาธารณะ + screenshot Supabase (เอาทั้งคู่)

- **/stats สาธารณะในแอพ** (ไม่ต้องล็อกอิน) = ของโชว์หลัก + social proof; แสดง: headline 2 ตัว (registered/activated) + กราฟการเติบโตสะสมรายวัน + ตัวเลขรอง (เควสเสร็จรวม, streak สูงสุด/เฉลี่ย); **ไม่มี PII** (aggregate เท่านั้น) — read-only aggregate query ต้นทุน 0 ไม่กินโควต้า Gemini
- **Screenshot Supabase dashboard** = หลักฐานยืนยันเลขไม่ปั้น แนบในสไลด์ pitch เท่านั้น

### 7.3 Metric ที่ต้องเก็บตั้งแต่วันเปิดตัว

metric เป็น time-series — **ถ้าไม่บันทึก event ตั้งแต่วันแรก จะย้อนสร้างกราฟตอน pitch ไม่ได้เลย**. ต้องมี timestamp ต่อ event ตั้งแต่ deploy วันแรก:
- Registered ← `profiles.created_at`
- Activated ← ≥1 แถวใน `quest_completions.completed_at`
- **DAU ← `activity_log(user_id, event_type, created_at)`** — ตัวที่พลาดง่ายสุด; DAU = distinct user_id ต่อวัน
- เควสเสร็จ ← `quest_completions.completed_at`
- Streak เฉลี่ย ← `profiles.current_streak/longest_streak`
- คนจ่ายเงิน ← `payments` + `is_premium` (ต้องมี timestamp ตั้งแต่คนแรกที่จ่าย)

> `activity_log` ถูกใส่ใน schema #15 แล้ว — event_type ควร lock ให้ชัด (login/quest_complete/chat/roadmap_start/share/referral_signup/premium_submit)

---

## 8. Deploy & โครงโปรเจกต์ (#16)

แผนเต็ม (โครงโฟลเดอร์, netlify.toml, env vars, Supabase/Google OAuth checklist, free tier ceilings): **[assets/deploy-plan.md](assets/deploy-plan.md)**

**สรุป:**
- **Repo `luiquest`:** Vite+React SPA ใน `src/` (`components/` = จุด drop-in งานดีไซน์จากเพื่อน), functions ใน `netlify/functions/` (chat / generate-quest / pre-generate-quests + `_shared/` สำหรับ fallback chain + supabase admin client), `supabase/schema.sql` จาก #15
- **netlify.toml:** `npm run build` → `dist`, SPA fallback redirect, scheduled function cron `*/10 19-21 * * *` UTC (= ตี 2–5 เวลาไทย ทุก 10 นาที batch เล็ก ~2–3 calls/รอบ) — ออกแบบรอบ timeout ~10 วิของ function ฟรี (Background Functions 15 นาทีไม่มีในแผนฟรี ห้ามพึ่ง); capacity ~54 generate/คืน ขยาย window ได้ฟรี
- **Env vars 5 ตัว:** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (client, ปลอดภัยเมื่อเปิด RLS), `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` + `GEMINI_API_KEY` (function เท่านั้น). **กฎเหล็ก: secret ห้ามตั้งชื่อขึ้นต้น `VITE_`** (Vite จะฝังลง bundle)
- **Deploy:** `ARCHEMETIS/luiquest` branch `main` → auto-deploy, site `luiquest.netlify.app` (ถ้าโดนจอง ใช้ `luiquest-app`), rollback ผ่าน Publish deploy เก่าได้ฟรี
- **Supabase ใหม่:** region Singapore, แยกจาก ml-quest (free tier ให้ 2 โปรเจกต์พอดี); pause หลัง 7 วันเงียบ (cron กลางคืนกันให้)
- **Google OAuth:** redirect URI ตัวจริง = `https://<project-ref>.supabase.co/auth/v1/callback`, Site URL = production, additional redirects ครอบ localhost:8888/5173; consent screen scope default (ไม่ต้องผ่าน Google verification) แต่ **ต้องกด Publish app** (โหมด Testing จำกัด 100 users + refresh token หมดอายุ 7 วัน)
- **Free tier ทั้งสาย:** Netlify 125k invocations / 300 build min, Gemini key ไม่ผูก billing = เกินโควต้าแค่ 429 ไม่มีทางเสียเงิน

---

## 9. แผนหาผู้ใช้ & Timeline (#09)

**หลักคิด (คนเดียว, งบ 0, 2 สัปดาห์):** เจ้าของเริ่มจากศูนย์ (ไม่มี follower) → แรงโตมาจากคนที่เอื้อมถึงตัวจริง แล้วให้แอพช่วยส่งต่อ ไม่ใช่ยิงคอนเทนต์หวังคนแปลกหน้า; ทุกช่องทางทำเสร็จได้ใน 10–20 นาที/วัน + วัดผลจากตัวเลขในแอพ

**ช่องทางเรียงตามความคุ้ม:**
1. 🥇 **เพื่อนตรง/กลุ่มแชทที่มีอยู่** (วันแรกทันที) — conversion สูงสุด; เป้า seed 15–30 คนที่ "ทำเควสจริง"; ทักทีละกลุ่ม ไม่ broadcast
2. 🥈 **กลุ่ม Facebook/Discord/Line มหาลัย** (วันที่ 2–4) — โทน builder ขอ feedback ไม่ใช่ขายของ; เช็คกฎห้ามโฆษณา + ทักแอดมินก่อน
3. 🥉 **TikTok/X/Reels** (ออปชัน ปลายสัปดาห์ 1) — ROI ต่ำช่วงแรก; ใช้แบบประหยัด = อัดจอการ์ดแชร์ streak โพสต์เป็น proof; ถ้าเลือกอันเดียว = TikTok

**mechanic ในแอพเป็นตัวเร่ง viral (Wave 1 มีครบ):** ลิงก์ชวนเพื่อน (XP ทั้งคู่ → seed users มีแรงจูงใจชวนต่อ), การ์ดแชร์ streak (โฆษณาฟรี), leaderboard ("มาแข่ง XP กัน"). หลักการ: เจ้าของจุดไฟ seed → mechanic รับช่วงเป็นเครื่องยนต์

**Milestone (สัญญาณทิศทาง ไม่ใช่ KPI ตายตัว):**
- **สัปดาห์ 1:** สมัคร ~20–40 คน, D1 retention ~1 ใน 3, ลิงก์ชวนถูกใช้ ≥2–3 ครั้งที่ไม่ใช่เจ้าของ → ถ้าสมัครเยอะแต่ไม่ทำเควสต่อ = ปัญหาที่ตัวแอพ หยุดหว่านคนใหม่ ไปแก้เควสแรกก่อน
- **สัปดาห์ 2:** สะสม ~50–80 คน, มี viral ชั้นสอง (คนอื่นชวนเองได้), มีคน streak แตะ 7 วัน → ถ้ายอดโตเฉพาะตอนเจ้าของโพสต์ = loop ยังไม่ติด เพิ่มโบนัสลิงก์ชวน/ดันปุ่มแชร์; ถ้า retention ร่วง = เร่ง Wave 2 web push

**Timeline:** เปิดตัว Wave 1 ~สัปดาห์ที่ 2 ก.ค. → 2 สัปดาห์หาผู้ใช้จบราวสิ้น ก.ค. → เหลือ ~1.5 สัปดาห์ถึงนำเสนอ **~9 ส.ค. 2026** (เริ่ม Wave 2 ไว้โชว์เป็นของใหม่). เก็บตัวเลขทุกช่วงเป็นข้อมูลดิบสำหรับสไลด์. แผนสำรองถ้ายอดไม่เดิน: เล่าเป็น narrative การทดลอง+เรียนรู้จาก retention/viral ที่วัดได้จริง

---

## 10. UI/Design (#10)

เพื่อนของเจ้าของออกแบบ UI ทั้งหมดใน Claude (claude.ai) แล้วส่งกลับเป็น **React component (JSX + Tailwind)** — brief เต็ม + พรอมต์สำเร็จรูป (copy วางได้ทันที): **[assets/design-brief-ui.md](assets/design-brief-ui.md)**

- ครอบคลุม **10 หน้าจอ + app shell:** Login, Onboarding 3 ขั้น, เควสรายวัน, แชทโค้ช, Leaderboard, ชวนเพื่อน, การ์ดแชร์ streak, **/stats สาธารณะ** — ทุกหน้าระบุข้อมูล/state + edge states (โหลด, ว่าง, โควต้าแชทหมด, streak ขาด, ผู้ใช้ใหม่วันแรก, คนน้อยช่วงเปิดตัว)
- **ข้อกำหนดตายตัว:** แบรนด์/โทนไทย ๆ, ภาษาไทย, mobile-first + iPad, PWA standalone, ส่งงาน React JSX + Tailwind (ห้าม TS/CSS แยก/UI lib ภายนอก), icon = SVG inline/emoji, mock data บนหัวไฟล์
- **เปิดกว้าง 100%:** สี/layout/typography/ธีมเกม/mascot — เพื่อนตัดสินเอง; ดีไซน์เดิม (ML Quest) ทิ้งแล้ว
- ฟีเจอร์ Wave 2 (push/duo/premium) ไม่ต้องออกแบบตอนนี้ แค่เว้นที่ nav ให้ขยายได้

> **หมายเหตุ:** ticket #10 answer เดิมระบุ /stats อยู่หมวด "รอยืนยัน" แต่ #14 ปิดแล้วว่า **เอาแน่** และ asset design-brief ถูกอัพเดตให้ /stats เป็นหน้าที่ต้องออกแบบแล้ว → เจ้าของต้องส่ง brief เวอร์ชันล่าสุดนี้ให้เพื่อน (ดู section 11)

---

## 11. รายการสิ่งที่เจ้าของต้องตัดสินใจ/ทำเอง

รวบ "จุดที่ควรรีวิว" + งานมือจากทุก ticket มาไว้ที่เดียว — effort implement ต้องเคลียร์รายการนี้กับเจ้าของ

### A. งานมือที่ต้องทำก่อน/ระหว่าง implement
1. **[งานค้าง] rename โฟลเดอร์ `new app/` → `luiquest/`** — ติด file lock (โปรแกรมอื่นเปิดโฟลเดอร์อยู่); ปิดโปรแกรมแล้วสั่ง `Rename-Item "new app" luiquest` เอง (#05)
2. **Google OAuth setup** — บางขั้นต้องใช้บัญชี Google ของเจ้าของเอง (สร้าง project, consent screen, Client ID/Secret, **กด Publish app**) (#16)
3. **Bootstrap admin คนแรก** — หลัง deploy ต้องรัน `update profiles set is_admin=true where id='<owner-uuid>'` ด้วยมือครั้งเดียว มิฉะนั้นไม่มีใคร verify payment ได้ (#15)
4. **เช็ค AI Studio rate-limit dashboard** — ยืนยันตัวเลขโควต้าจริงของโปรเจกต์ (5 นาที) + เช็คว่า `gemini-3.5-flash`/`3.1-flash-lite` ให้เท่าไร (#03)
5. **เขียนคลังเควส static fallback** อย่างน้อยหัวข้อละ 3–5 เควส + เติม starter_quests ให้ครบ 18 แถว (content/checklist จริงจากแหล่งเรียนไทย) (#03/#15)
6. **ส่ง design brief เวอร์ชันล่าสุดให้เพื่อน** — ที่มีหน้า /stats รวมแล้ว (10 หน้า) (#10/#14)

### B. การตัดสินใจเชิงธุรกิจ/ราคา
7. **ราคา 39 บาท/เดือน (เจ้าของเคาะ 12 ก.ค.)** — ทางเลือก 29 (friction ต่ำ) / **39 (เลือก)** / 59 (เท่า Spotify student); `amount` เก็บเป็นฟิลด์แล้ว → ปรับขึ้นลงได้ทันที ไม่กระทบ schema (#08/#13)
8. **รายเดือน = รอบบิลถี่** — verify สลิป manual ซ้ำทุกเดือนต่อผู้จ่าย (~4 เท่าของรายเทอม); ถ้ายอดผู้จ่ายพุ่งต้องรีบทำ flow กึ่งอัตโนมัติ (#08/#13)
9. **"Recurring revenue" ใน pitch** — รายเดือนเป็น recurring จริงที่สังเกตรอบ renew ได้ในกรอบเวลาวิชา (แข็งกว่ารายเทอม); ถ้าถึง pitch ยังไม่มีใครครบรอบ renew ก็พูดว่า "recurring by design" (#08)
10. **เบอร์/เลขพร้อมเพย์ที่ฝังใน QR** — ต้องเป็นบัญชีที่เจ้าของโอเคให้ผู้ใช้เห็น (เลขปรากฏใน QR payload ฝั่ง client); ยืนยันความสบายใจเรื่อง privacy (#13)
11. **โบนัส XP ของลิงก์ชวน (ตัวเลขจริง)** — ยังไม่ล็อก; ต้องกัน self-invite ปั๊มยอดปลอม (unique referred_id ช่วยแล้วระดับ schema) (#09/#06)

### C. จุดที่ต้องระวัง/อย่าลืม (technical)
12. **[ห้ามลืม] timestamp ทุก event ตั้งแต่ commit แรกที่ deploy** — `created_at/completed_at/last_active_at/submitted_at` + ตาราง `activity_log`; ถ้าลืม กราฟโตตอน pitch หายหมด (#14)
13. **Lock รายการ event_type ของ activity_log** ให้ชัดตอน implement เพื่อ query ตรงกัน (#15)
14. **service_role key เก็บ server-side เท่านั้น** ห้ามหลุดไป client (ห้ามตั้งชื่อขึ้นต้น VITE_) (#15/#16)
15. **scheduled pre-generate ต้อง idempotent** — เช็ค DB ก่อนยิง (unique (roadmap_id, day_number) กันแล้ว แต่ต้อง handle conflict แบบ reuse) (#03/#15)
16. **auto-expire premium — runway สั้นเพราะรายเดือน** — `premium_until` = now+1เดือน; แม้ยังไม่มีใครหมดอายุก่อน pitch 9 ส.ค. (premium เพิ่งเปิด Wave 2) แต่ **ต้องทำ cron flip กลับภายใน ~1 เดือนหลังเปิด premium** ไม่งั้น premium กลายเป็นฟรีตลอดชีพ (#13/#15)
17. **soft cap แชท premium ~100/วัน** — กัน abuse โควต้า Gemini ถ้าผู้จ่ายโตเร็ว (#13)
18. **Supabase pause 7 วัน** — ช่วงพัฒนาก่อน cron ขึ้น ถ้าเงียบเกิน 7 วันต้องเข้า dashboard restore เอง (#16)

### D. Privacy / policy (กรรมการวิชาอาจถาม)
19. **เกณฑ์ activated = "ทำเควสเสร็จ ≥1"** — เช็คกับอาจารย์ว่ายอมรับนิยามนี้ไหม (ถ้าเข้มกว่า เช่น active ≥2 วัน ต้องปรับ) (#14)
20. **Privacy /stats + leaderboard** — /stats aggregate ล้วน 0 PII; leaderboard โชว์ชื่อ/รูป (มี `leaderboard_opt_out` ให้แล้ว); ยืนยัน view ไม่หลุด PII เกิน (#14/#15)
21. **ผู้ใช้ได้สิทธิ "หลัง verify" ไม่ใช่ทันทีที่อัปสลิป** — เลือกแบบนี้กันสลิปปลอม แลกด้วย delay ≤24 ชม.; ถ้าอยากลด friction ช่วงโปรโมต พิจารณาให้สิทธิทันทีตอน submit แล้ว revoke ทีหลัง (ยังไม่เลือก) (#13)

### E. รีวิวแผนการตลาด (เจ้าของรู้เครือข่ายจริงดีกว่า)
22. **ตัวเลข milestone เป็นค่าประมาณ** — ปรับตามขนาดวงเพื่อน/กลุ่มมหาลัยจริง (#09)
23. **ลิสต์กลุ่ม Facebook/Discord/Line ที่โพสต์ได้จริง** — เจ้าของต้องลิสต์กลุ่มที่เป็นสมาชิก + เช็คกฎห้ามโฆษณาแต่ละกลุ่ม (#09)
24. **TikTok เป็นออปชัน** — ถ้าไม่อยากแตะเลยตัดได้ ช่องทาง 1–2 พอเป็นเครื่องยนต์หลัก (#09)
25. **badge premium อาจถูกตัดถ้าเวลาบีบ** — แนะนำเก็บเพราะช่วย social proof/viral (ตัดคือตัดชั่วคราว) (#13)

---

*เอกสารประกอบ (assets/):*
- *[supabase-schema.md](assets/supabase-schema.md) — SQL DDL + RLS เต็ม (#15)*
- *[deploy-plan.md](assets/deploy-plan.md) — โครงโปรเจกต์ + Netlify/Supabase/OAuth setup (#16)*
- *[thai-lesson-sources.md](assets/thai-lesson-sources.md) — แหล่งเรียน + whitelist 24 โดเมน (#12)*
- *[design-brief-ui.md](assets/design-brief-ui.md) — brief + พรอมต์ให้เพื่อนออกแบบ (#10)*
- *[gemini-quota-research.md](assets/gemini-quota-research.md) — โควต้า + กลยุทธ์ประหยัด AI (#03)*

*รวบเมื่อ 12 ก.ค. 2026 — ticket #11 (assemble-spec). ถึง Destination ของแผน app-v2-spec แล้ว*
