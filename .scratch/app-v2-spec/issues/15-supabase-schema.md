# ออกแบบ schema Supabase

Type: task
Status: open
Blocked by: 13

## Question

ออกแบบ schema Postgres/Supabase ของลุยเควสเป็นเอกสาร (ยังไม่รันจริง — implementation เป็น effort ถัดไป): ตาราง users/profiles, roadmaps ต่อหัวข้อ (cache ตลอดชีพตามผล #03), daily quests (pre-generated), progress/XP/streak, starter quests 18 ชุด (#04), referral/ลิงก์ชวนเพื่อน, leaderboard query, flag premium + จำกัด active roadmap ต่อ user (ฟรี 1 หัวข้อ), บันทึกการจ่ายเงิน/ยืนยัน PromptPay (รอผล #13), นโยบาย RLS ต่อตาราง, และช่องรองรับ Wave 2 (duo/เพื่อน, web push subscription) — ผลลัพธ์เป็นไฟล์ markdown (SQL DDL + คำอธิบาย) แนบเป็น asset

Stack ล็อกแล้วใน [สถาปัตยกรรมและ tech stack](07-tech-stack.md); บล็อกด้วย [เก็บเงินจริงใน MVP](13-real-monetization.md) เพราะโครงตารางฝั่งจ่ายเงินขึ้นกับวิธีเก็บ/ยืนยันที่เลือก
