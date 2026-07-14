# ฟีเจอร์โต Wave 1: ลิงก์ชวน + leaderboard + การ์ดแชร์ + /stats

Type: task
Status: partial (14 ก.ค. 2026 — backend ลิงก์ชวนเสร็จ, ที่เหลือรอ UI)
Blocked by: 06, 09

## ผลลัพธ์บางส่วน (14 ก.ค. 2026)

- ✅ **`netlify/functions/redeem-referral.js`** — endpoint เดียวที่ยังไม่ติด UI (ไม่ต้องรอ 09): POST `{ referral_code }` พร้อม auth → เช็ค self-invite/double-redeem/code ไม่มีจริง, แจก XP 20 ให้ทั้งคู่ (ตัวเลขยังไม่ล็อกในสเปก #09 flag 11 — ตั้งเท่า xp_reward เควสระดับกลาง), เขียน `referrals` + `activity_log` (`referral_signup`) ผ่าน service role กันผู้ใช้โกงเอง — กัน race ด้วย unique constraint `referrals.referred_id` (ทดสอบ concurrent request คู่ขนานแล้ว ได้ XP แค่ครั้งเดียว)
- ✅ **เจอ+แก้บั๊กร้ายแรงระหว่างทดสอบ:** `handle_new_user()` trigger fail 100% (ไม่มีใครสมัครแอพได้เลยสักคน) — รายละเอียดเต็มอยู่ที่ [issues/03-deploy-schema.md](03-deploy-schema.md) หัวข้อ "บั๊กร้ายแรงที่เจอ+แก้แล้ว"
- ✅ ทดสอบผ่าน `netlify dev` จริงกับ production Supabase (สร้าง/ลบ test user ผ่าน `auth.admin.createUser`, 13/13 เช็คผ่าน: happy path, self-invite, double-redeem, invalid code, unauthenticated, race condition) — ลบ test data ออกหมดแล้ว
- ⬜ **Leaderboard / /stats / streak share card:** ตามสเปก ทั้งสามอันอ่านจาก view (`leaderboard`/`public_stats`/`stats_daily_growth`) ที่ deploy ไว้แล้วตั้งแต่ ticket #03 โดยตรงผ่าน `src/lib/supabaseClient.js` (RLS/grants เปิดให้อ่านตรงได้ ไม่ต้องผ่าน Netlify Function) — งานที่เหลือคือ **UI wiring ล้วน ๆ** ซึ่งเป็นขอบเขตของ ticket #09 (ต้องรอ component ที่เหลือจากเพื่อน)

## งานที่ต้องทำ

ทำกลไกโต Wave 1 (จาก #06, #09, #14) — ตัวขับยอดผู้ใช้ที่วิชานี้เอาไปวัดคะแนน:

- **ลิงก์ชวนเพื่อน** — สมัครผ่านลิงก์แล้วนับยอด + ให้ XP ทั้งผู้ชวนและผู้ถูกชวน
- **Leaderboard** — อันดับ XP รวมทั้งแอพ
- **การ์ดแชร์ streak** — สร้างภาพสำหรับโพสต์ IG story/LINE
- **หน้า /stats สาธารณะ** — ดึงจาก VIEW (activated = ทำเควส ≥1) ไว้โชว์อาจารย์/แชร์

## เสร็จเมื่อ

สมัครผ่านลิงก์ชวนแล้ว XP เข้าทั้งคู่ + ยอดนับถูก, leaderboard เรียงถูก, การ์ด render ออกภาพได้, /stats แสดงตัวเลขจริง — ยืนยันด้วย `/verify`
