# Design brief/พรอมต์ให้เพื่อนออกแบบ UI

Type: task
Status: resolved (2026-07-12)
Blocked by: 06

## Question

เจ้าของจะให้**เพื่อนออกแบบ UI ทั้งหมดใน Claude** (ผล ticket [สถาปัตยกรรมและ tech stack](07-tech-stack.md), 12 ก.ค. 2026) — งานของ ticket นี้คือผลิต **design brief + ตัวพรอมต์สำเร็จรูป** ที่เพื่อนเอาไปวางใน Claude แล้วเริ่มออกแบบได้ทันที โดย**ไม่ fix design** (ดีไซน์เดิม `ML Quest Master.html` ทิ้งแล้ว เปิดกว้าง 100%)

Brief ต้องครบพอที่เพื่อนไม่ต้องเดา requirement:

1. **รายการหน้าจอครบทุกหน้า** (จากฟีเจอร์ MVP #06 + login/onboarding #04): login, onboarding 3 ขั้น, หน้าเควสรายวัน (checklist gating, XP, streak, phase progress, grade), แชทโค้ช (limit 10/วัน), leaderboard, ลิงก์ชวนเพื่อน, การ์ดแชร์ streak, หน้า /stats สาธารณะ (ถ้า ticket #14 สรุปว่าเอา)
2. **ข้อมูล/state ที่แต่ละหน้าต้องแสดง** + edge states (โหลด, ว่าง, โควต้าแชทหมด, streak ขาด)
3. **ข้อกำหนดตายตัวที่ดีไซน์ต้องเคารพ**: แบรนด์ ลุยเควส — โทนสนุก เป็นกันเองแบบไทย ๆ (#05), ภาษาไทย, **responsive: mobile-first + iPad/tablet**, PWA, ผลงานส่งกลับเป็น **React component (JSX + Tailwind)** ให้เข้ากับ stack (#07)
4. **สิ่งที่เปิดกว้าง**: โทนสี, layout, typography, ธีมความเป็นเกม — เพื่อนตัดสินใจเอง

ผลลัพธ์: ไฟล์ brief (markdown) + พรอมต์พร้อมส่ง แนบเป็น asset ใน ticket นี้ — เจ้าของอ่านทวนแล้วส่งให้เพื่อนเอง

**ประวัติ:** เดิม ticket นี้เป็น prototype ("ต้นแบบหน้าจอหลัก" — ทำ HTML prototype ต่อยอด `ML Quest Master.html` + ตัดสินเรื่อง mobile-only/responsive) ถูกเขียนใหม่ 12 ก.ค. 2026 หลังเจ้าของตัดสินใจให้เพื่อนออกแบบและทิ้งดีไซน์เดิม; คำถาม responsive ถูกตอบแล้วใน #07 (ต้องรองรับ iPad → responsive)

## Answer

เขียน design brief ฉบับเต็ม + พรอมต์สำเร็จรูป (self-contained, copy วางใน Claude ได้ทันที) → **[assets/design-brief-ui.md](../assets/design-brief-ui.md)**

- ครอบคลุม **9 หน้าจอ + app shell/navigation**: login, onboarding 3 ขั้น, เควสรายวัน, แชทโค้ช, leaderboard, ชวนเพื่อน, การ์ดแชร์ streak — ทุกหน้าระบุข้อมูล/state ที่ต้องแสดง + edge states (โหลด, ว่าง, โควต้าแชทหมด, streak ขาด, ผู้ใช้ใหม่วันแรก, คนน้อยช่วงเปิดตัว ฯลฯ)
- ข้อกำหนดตายตัวครบ (แบรนด์/โทนไทย ๆ, ภาษาไทย, mobile-first + iPad, PWA, ส่งงาน React JSX + Tailwind ห้าม TS/UI lib ภายนอก) และเปิดกว้าง 100% เรื่องสี/layout/typography/ธีมเกม — ไม่ fix design แทนเพื่อน
- **หน้า /stats สาธารณะ** อยู่ในหมวด "อาจมีเพิ่ม (รอยืนยัน)" — รอ ticket #14 ปิดก่อน ถ้าเอาจริงต้องแจ้งเพื่อนเพิ่มทีหลัง; ฟีเจอร์ Wave 2 ระบุเป็น "รู้ไว้เผื่อ nav ขยายได้" ไม่ต้องออกแบบตอนนี้
- ขั้นตอนใช้งาน: เจ้าของอ่านทวน brief → ส่งให้เพื่อน → เพื่อน copy section "พรอมต์พร้อมวาง" ท้ายไฟล์ไปวางใน claude.ai (พรอมต์สั่งให้ Claude เสนอ design direction 2–3 ทางก่อน แล้วค่อยทำทีละหน้าเป็น artifact)
