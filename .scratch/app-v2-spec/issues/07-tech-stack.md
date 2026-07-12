# สถาปัตยกรรมและ tech stack ของแอพใหม่

Type: grilling
Status: closed (12 ก.ค. 2026)
Blocked by: 03, 06

## Question

คง pattern เดิม (static HTML + Netlify Functions + Supabase) ที่พิสูจน์แล้วว่าฟรีและเวิร์ค หรือขยับไป framework (เช่น Vite+React หรือ Next บน Netlify)? ตัดสินจากฟีเจอร์ MVP (06) และข้อจำกัดโควต้า (03) — น้ำหนักอยู่ที่ "สร้างเสร็จใน 2 สัปดาห์โดยคนเดียว" ไม่ใช่ความหรูหราของ stack รวมถึงตำแหน่ง cache layer สำหรับ AI calls

---

## Resolution (grilling กับเจ้าของ, 12 ก.ค. 2026)

**บริบทใหม่ที่เผยระหว่าง grilling (เปลี่ยนโจทย์):** เจ้าของอยากไปถึง Play Store/App Store และจะให้**เพื่อนช่วยออกแบบ UI ใน Claude** โดยส่งงานกลับเป็น React component — ฝั่งเราต้องเตรียม brief/พรอมต์ที่ละเอียดครบให้เพื่อนโดย**ไม่ fix design** และดีไซน์เดิม (`ML Quest Master.html`) **ทิ้งไปเลย เปิดกว้าง 100%** รวมถึงต้องรองรับ **iPad**

### Stack ที่ล็อก

- **Frontend: Vite + React (JSX) + Tailwind CSS + React Router** — SPA; เหตุผลชี้ขาดคืองานดีไซน์จากเพื่อน (Claude artifacts) เป็น React+Tailwind อยู่แล้ว รับของได้แบบแทบ copy-paste; ทิ้ง pattern static HTML ของ ml-quest (เหตุผลเดิมที่จะคงมันไว้ — reuse mockup — หายไปเพราะดีไซน์เดิมถูกทิ้ง)
- **PWA ผ่าน vite-plugin-pwa** — ติดตั้งได้จากเว็บทั้งมือถือ/iPad; **responsive บังคับ** (mobile-first + tablet/iPad breakpoints) — ปิดคำถาม mobile-only ที่ค้างใน ticket ต้นแบบหน้าจอ
- **Backend คงสูตรเดิม: Netlify Functions + Netlify Scheduled Function + Supabase** (Postgres + Auth + RLS) — Scheduled Function ทำ pre-generate เควสตอนกลางคืนตามผล ticket โควต้า
- **ตำแหน่ง cache layer: Supabase** — roadmap cache ตลอดชีพ, เควสรายวัน pre-generate ลงตาราง; กลางวัน frontend อ่านผ่าน function ล้วน ๆ ไม่แตะ Gemini; โมเดล: `gemini-3-flash` (งานหนัก) + `flash-lite` (แชท), fallback chain ตาม ticket โควต้า

### กลยุทธ์การปล่อย (ตัดสินใจร่วมกัน)

- **PWA-first**: เปิดตัว Wave 1 เป็นเว็บ + PWA (แชร์ลิงก์ได้ทันที เก็บยอดผู้ใช้ได้เลย ไม่มีค่าใช้จ่าย ไม่ติด review)
- **Play Store ทีหลัง** เมื่อพร้อมจ่าย $25 ครั้งเดียว — ห่อ PWA ด้วย TWA/Capacitor แทบไม่แก้โค้ด (หมายเหตุ: บัญชีบุคคลใหม่ต้องผ่าน closed testing ~12 tester/14 วันก่อนขึ้น production)
- **App Store พักไว้** — $99/ปี + ต้องมี Mac (เจ้าของใช้ Windows) ขัดข้อจำกัดงบศูนย์ชัดเจน

### ผลกระทบต่อ map

- Ticket "ต้นแบบหน้าจอหลัก" เปลี่ยนบทบาท: จากทำ HTML prototype ต่อยอดดีไซน์เดิม → **เขียน design brief/พรอมต์ให้เพื่อน** (ดีไซน์เดิมทิ้ง)
- ฟ็อก schema Supabase และแผน deploy คมพอแล้ว → ออกเป็น ticket ใหม่ (15, 16)
