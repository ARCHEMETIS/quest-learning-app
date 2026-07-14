# เขียน Netlify Functions แกนของลูปเควส

Type: task
Status: open
Blocked by: 02, 03

## งานที่ต้องทำ

เขียน function ฝั่ง server ที่เป็นแกนการเล่น (อ่าน/เขียน DB ล้วน ไม่แตะ Gemini):

- ตรวจ session/auth จาก Supabase (Google)
- อ่าน roadmap + เควสรายวันของผู้ใช้
- ทำเควสเสร็จ: checklist gating → ให้ XP → อัพเดต streak / phase progress / letter grade
- บันทึก `activity_log` ทุก event (สมัคร, ทำเควส, ล็อกอิน) สำหรับกราฟโต

## เสร็จเมื่อ

เรียก function ผ่าน (auth ถูกบล็อกเมื่อไม่ล็อกอิน), ทำเควสแล้ว XP/streak/phase อัพเดตถูกใน DB, มี row ใน activity_log — ยืนยันด้วย `/verify`
