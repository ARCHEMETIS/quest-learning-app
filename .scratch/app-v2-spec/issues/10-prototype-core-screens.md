# Design brief/พรอมต์ให้เพื่อนออกแบบ UI

Type: task
Status: open
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
