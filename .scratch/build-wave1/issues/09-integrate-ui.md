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

**พร้อม wiring แล้ว** (backend ticket 06/07 ปิดหมด): `me`/`start-roadmap`/`quest-today`/`complete-quest`/`chat`/`generate-quest` — ต่อ auth/state/API เข้ากับ 4 หน้าที่มีได้เลยโดยไม่ต้องรอ 6 หน้าที่เหลือ ถ้าอยากเริ่ม wiring บางส่วนก่อน
