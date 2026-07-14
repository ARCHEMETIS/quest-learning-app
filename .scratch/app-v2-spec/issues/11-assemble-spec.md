# รวบสเปกสุดท้ายเป็น spec.md

Type: task
Status: resolved (2026-07-12)
Blocked by: 04, 05, 07, 08, 09, 10, 12, 13, 14, 15, 16

## Question

รวมทุกการตัดสินใจจาก tickets ที่ปิดแล้วเป็น `spec.md` ฉบับเดียว: ชื่อ/positioning, ผู้ใช้เป้าหมาย, ฟีเจอร์ MVP, สถาปัตยกรรม + schema แนวทาง, กลยุทธ์โควต้า AI, login/onboarding flow, BMC สรุป, แผน freemium/เก็บเงินจริง, แผนหาผู้ใช้ — พร้อมส่งต่อให้ effort ถัดไป (ลงมือสร้าง) ทันที ถึงจุดนี้ = ถึง Destination ของแผนที่

## Answer

เขียน spec.md ฉบับสมบูรณ์แล้ว → **[../spec.md](../spec.md)** (วางที่ root ของ app-v2-spec)

- 11 section: (1) ภาพรวม/positioning (2) ขอบเขตผลิตภัณฑ์ (3) user flow (4) สถาปัตยกรรม+stack+โควต้า AI (5) data model (6) โมเดลธุรกิจ+เก็บเงิน PromptPay (7) metric/ผู้ใช้จริง (8) deploy (9) แผนหาผู้ใช้+timeline (10) UI/design (11) **รายการสิ่งที่เจ้าของต้องตัดสินใจ/ทำเอง 25 ข้อ** (จัด 5 หมวด A–E)
- รวบการตัดสินใจจาก ticket #01–#16 ทุกใบ; ราคา premium = **39 บาท/เดือน PromptPay** (เจ้าของเคาะรายเดือน 12 ก.ค. — เดิมเดารายเทอม 99 แล้วเปลี่ยน ตาม #08/#13); ลิงก์ asset 5 ไฟล์ด้วย relative path
- ถึง Destination ของแผน app-v2-spec — effort ถัดไป (implement) หยิบไปทำได้ทันที
