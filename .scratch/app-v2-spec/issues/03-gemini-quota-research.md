# โควต้า Gemini free tier ปัจจุบัน และกลยุทธ์ประหยัด AI

Type: research
Status: closed (2026-07-12)
Assignee: claude (session 2026-07-12)

## Question

ณ ก.ค. 2026 โควต้า free tier จริงของ Gemini แต่ละโมเดล (2.5-flash, 2.5-flash-lite, รุ่นใหม่กว่าถ้ามี) เป็นเท่าไหร่ (RPM/RPD/TPM)? โควต้านับต่อโปรเจกต์ — ถ้าผู้ใช้ N คนใช้พร้อมกัน จุดตายอยู่ตรงไหน? สรุปเป็นตาราง + เสนอกลยุทธ์: การ cache (roadmap ครั้งเดียว, เควสวันละครั้ง), จำกัดแชทต่อคน/วัน, แยกงานเบาไปโมเดล lite, fallback เมื่อโควต้าหมด และประเมินว่ารองรับผู้ใช้ active ได้กี่คน/วัน ผลลัพธ์เป็นไฟล์ markdown แนบลิงก์ใน ticket

## Resolution (2026-07-12)

รายงานเต็ม: [assets/gemini-quota-research.md](../assets/gemini-quota-research.md)

สรุปคำตอบ:

- **Google ไม่ประกาศตัวเลขสาธารณะแล้ว** — ตัวเลขจริงของโปรเจกต์ดูได้ที่ AI Studio rate-limit dashboard เท่านั้น (เช็ค 5 นาทีตอนเริ่ม implement) ตัวเลขด้านล่างเป็น planning number จาก third-party
- **โควต้า (RPD):** `gemini-3-flash` ~1,500 · `2.5-flash-lite` ~1,000 · `2.5-flash` ~250 (โดนหั่นหนัก ธ.ค. 2025 — ตัวที่ ml-quest เดิมใช้ ใช้เป็นโมเดลหลักไม่ได้แล้ว) · Pro ไม่ฟรีจริงอีกต่อไป · RPM ทุกตัว ~10–15, TPM ~250K · แต่ละโมเดลถังแยกกัน รวม ~2,500 calls/วัน
- **จุดตายคือ RPM ไม่ใช่ RPD** — ผู้ใช้เปิดพร้อมกันตอนพีคแล้ว trigger generate สด ๆ = 429 ทันที
- **กลยุทธ์ 4 ข้อ:** (1) pre-generate เควสรายวันตอนกลางคืนด้วย Netlify Scheduled Function + cache roadmap ใน Supabase ตลอดชีพ → กลางวันเป็นการอ่าน DB ล้วน (2) แบ่งงานตามโมเดล: roadmap/เควส→`gemini-3-flash`, แชท→`flash-lite` (3) จำกัดแชท 10 ข้อความ/คน/วัน (4) fallback chain 3-flash→lite→2.5-flash→เควสสำเร็จรูป static + exponential backoff
- **Capacity:** ~250–330 active users/วันแบบ chain เดียว, ~500–600 ใช้เต็ม chain — เหลือเฟือสำหรับเป้าวิชานี้ ความเสี่ยงเดียวคือ Google หั่นโควต้าอีก ซึ่ง fallback ปิดแล้ว
- **ผลต่อ tech stack (#07):** ต้องมี Netlify Scheduled Function ในสถาปัตยกรรม, โมเดลหลักย้ายจาก `gemini-2.5-flash` ไป `gemini-3-flash` + `flash-lite`
