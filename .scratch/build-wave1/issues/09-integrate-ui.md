# เสียบ React components ของเพื่อน: auth + onboarding + ลูปเล่น

Type: task
Status: open
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
