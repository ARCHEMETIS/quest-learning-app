# คัดแหล่งบทเรียนไทยสำหรับ 6 หัวข้อเปิดตัว

Type: research
Status: resolved

## Question

สำหรับหัวข้อ curated ทั้ง 6 (Python, Data/ML, สร้างเว็บ, ใช้ AI ให้เป็น, Excel/Sheets, การเงินส่วนบุคคล — ดูคำตอบใน "ขอบเขตหัวข้อเรียน" #02): หาแหล่งบทเรียนฟรีของจริง เน้นไทยก่อนอังกฤษเสริม ต่อหัวข้อ 3-5 แหล่ง — ทุก URL ต้องเช็คว่าเข้าได้จริงและ stable (แบบลิงก์ Kaggle ใน ml-quest) ผลลัพธ์: (1) ไฟล์ markdown รายการแหล่งต่อหัวข้อ พร้อมโครงบทเรียนคร่าว ๆ ที่เควสจะไล่ตาม (2) whitelist โดเมนสำหรับ guardrail โหมดพิมพ์อิสระ — ทั้งสองอย่างจะกลายเป็นข้อมูลตั้งต้นในโค้ดจริง

## Answer

ทำ research เสร็จ 12 ก.ค. 2026 — ผลทั้งหมดอยู่ใน asset **[`assets/thai-lesson-sources.md`](../assets/thai-lesson-sources.md)**: แหล่งฟรี 4-5 แหล่งต่อหัวข้อ (ไทยเป็นแกน อังกฤษเสริม) + โครงบทเรียนคร่าว ๆ ต่อหัวข้อ + whitelist 24 โดเมน + pattern ลิงก์ค้นหาที่อนุญาต

สรุปแกนหลักต่อหัวข้อ:
1. **Python** — borntoDev School (Zero to One: Python, คอร์สฟรี) + KongRuksiam YouTube; เสริม Skooldio ฟรี/Chula MOOC/W3Schools
2. **Data/ML** — Kaggle Learn เป็นแกน (ยกจาก ml-quest ตามมติ #02) ประกบด้วย DataRockie, DataTH, PrasertCBS
3. **สร้างเว็บ** — Code-TH.com (อ่าน) + borntoDev Fundamental Web Dev (วิดีโอ) + KongRuksiam; เสริม MDN/freeCodeCamp
4. **ใช้ AI ให้เป็น** — Skooldio "Unlock AI with Prompt Engineering" (ฟรี) + depa digitalskill.org; หัวข้อนี้แหล่งไทยกระจายเป็นคลิปย่อย → พึ่งลิงก์ค้นหา YouTube มากกว่าหัวข้ออื่น
5. **Excel/Sheets** — เทพเอ็กเซล (thepexcel.com) + borntoDev Excel for Everyone; ฝั่ง Google Sheets ไม่มีแหล่งไทยรวมเล่มดี ๆ → ใช้ลิงก์ค้นหา
6. **การเงินส่วนบุคคล** — SET e-Learning (มีใบประกาศ แต่ต้องสมัครสมาชิก) + SET Invest Now (ไม่ต้องล็อกอิน) + สตางค์ Story ธปท. + aomMONEY + Money Buffalo

การเช็ค URL: ทุกลิงก์ยิง HTTP ผ่าน 200 จริง (curl + browser UA, 12 ก.ค. 2026) ข้อควรระวังที่เจอ: **aommoney.com ต้องไม่มี www**, Chula MOOC เปิดรับเป็นรอบ, SET e-Learning ต้องสมัครสมาชิกฟรีก่อนเรียน

ตัดออกพร้อมเหตุผล (บันทึกใน asset): ThaiMOOC (กำลังย้ายแพลตฟอร์ม), 1213.or.th (เข้าไม่ได้), cbtumu.net (ที่มาไม่ชัด), SkillLane/FutureSkill/Udemy (โมเดลจ่ายเงิน)

**ส่งต่อ:** asset นี้เป็นข้อมูลตั้งต้นของ (ก) starter quests 18 ชุด (6 หัวข้อ × 3 ระดับ ตามมติ #04) (ข) ค่าคงที่ whitelist ใน generate-quest — ทั้งคู่เป็นงาน implement ใน effort ถัดไป
