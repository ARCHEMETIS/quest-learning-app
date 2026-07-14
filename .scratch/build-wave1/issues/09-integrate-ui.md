# เสียบ React components ของเพื่อน: auth + onboarding + ลูปเล่น

Type: task
Status: open (บางส่วนพร้อม 14 ก.ค. 2026 — ดูหมายเหตุท้ายไฟล์)
Blocked by: 02, 06

## งานที่ต้องทำ

เอา React components 10 หน้าจากเพื่อน (ตาม `design-brief-ui.md`) มาต่อชีวิตจริง:

- ต่อ routing (React Router) ทั้ง 10 หน้า + app shell
- Google Sign-in ผ่าน Supabase Auth (ดึงชื่อ/รูปจาก Google อัตโนมัติ)
- onboarding 3 ขั้น (หัวข้อ → ระดับ → เวลา/วัน) → เสิร์ฟ starter quest ทันที
- เสียบ state/API หน้าเล่น: เควสรายวัน, checklist, XP/streak/phase/grade, แชทโค้ช
- edge states ครบ (loading, ว่าง, error) ตาม brief

## เสร็จเมื่อ

เดินลูปเต็มในเครื่องได้: ล็อกอิน Google → onboarding → เห็นเควสแรก → ทำเสร็จได้ XP → แชทได้ — ยืนยันด้วย `/verify` + `/run`

## ความคืบหน้า (14 ก.ค. 2026)

เพื่อนส่ง component มาทาง GitHub PR (`frontend/add-ui-components`, merge แล้ว) — ได้ 4/10 หน้า: `LoginPage.jsx`, `OnboardingFlow.jsx` (ครบ 3 ขั้น), `DailyQuestPage.jsx`, `CoachChatPage.jsx` + component ใช้ร่วม `GhostMascot.jsx`/`LuiQuestLogo.jsx` อยู่ใน `src/components/` แล้ว (commit `750ee86`, push ขึ้น GitHub แล้ว) โค้ดตรง design brief (JSX+Tailwind, mock data บนหัวไฟล์, มี state toggle ครบ edge states), `npm run build` ผ่าน

**ยังขาด:** Leaderboard, ชวนเพื่อน, การ์ดแชร์ streak, /stats, app shell/navigation (6 หน้า) — รอเพื่อนส่งเพิ่ม

## Wiring 4 หน้าที่มี — เสร็จแล้ว (14 ก.ค. 2026 ค่ำ, commit `9f08d0f` push แล้ว)

ลูปเต็มเดินได้จริงในเครื่อง ยืนยันด้วยเบราว์เซอร์จริง + บัญชี Google จริง + production Supabase/Gemini:
ล็อกอิน Google → onboarding 3 ขั้น (curated ยิง `start-roadmap` ระหว่างหน้าคั่น) → เห็นเควสแรกทันที →
ติ๊ก checklist ครบ → เคลม XP → ฉากฉลอง (+XP/streak) → แชทโค้ช (Gemini ตอบจริง, โควต้านับถูก) ✅

สิ่งที่เพิ่ม: `AuthProvider` context (useAuth), `useProfile` hook (`activeRoadmapId`/`patchProfile`/`error`),
`src/lib/topics.js` (map การ์ดเพื่อน→slug จริง), `src/pages/Coach.jsx` + route `/coach`, auth guard ทุก route

บั๊กที่เจอ+แก้ระหว่าง verify + code review 8 มุม:
1. **auth loop**: แต่ละหน้าเรียก `useAuth()` แยกกัน → ช่วง session=null ก่อน getSession resolve ทำ redirect ปิงปอง + ยิง `/me` ไม่หยุด → แก้เป็น context เดียวที่ App
2. **ฉากฉลองโดนข้าม**: guard `profileLoading` เด้ง quest prop กลับ MOCK ชั่วคราวระหว่าง refetch → claimResult ถูกรีเซ็ต → แก้ guard + เปลี่ยน refetch เป็น `patchProfile` จาก response ของ complete-quest (ประหยัด invocation ด้วย)
3. **ประวัติแชทเรียงผิด**: `asc+limit(50)` ได้เก่าสุด 50 แถว → โควต้าเพี้ยนเมื่อแชทเกิน 50 แถว → แก้เป็น desc+reverse (แพทเทิร์นเดียวกับ chat.js)
4. **state "streak ขาด" ไม่มีทางโผล่**: backend รีเซ็ต streak แบบ lazy — เช็คจาก `last_quest_date` แทน `current_streak`
5. **/me ล้มเหลวชั่วคราว = เด้งกลับ onboarding ผิด ๆ**: เพิ่ม `error` ใน useProfile + gate redirect + หน้า retry

**Known follow-ups (ยอมรับได้ ยังไม่ทำ):** useProfile ยังเรียกแยกต่อหน้า (โหลดใหม่ทุก navigation — ถูกต้องแต่ไม่ประหยัดสุด ถ้าหน้าเยอะขึ้นค่อยยกเป็น context แบบ useAuth), GRADE_BANDS ใน Quest.jsx ต้อง sync มือกับ gameplay.js ถ้า threshold เปลี่ยน, preview toggle ของ component เพื่อนบางตัวเป็น dead path แล้ว (ไม่กระทบ production)

**เหลือปิด ticket:** wiring 6 หน้าที่เหลือเมื่อเพื่อนส่ง component มา (backend/API พร้อมหมดแล้ว)
