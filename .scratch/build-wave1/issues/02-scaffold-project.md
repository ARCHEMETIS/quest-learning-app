# วางโครงโปรเจกต์ Vite + React + PWA ใน repo luiquest

Type: task
Status: claimed
Blocked by: —

## งานที่ต้องทำ

สร้าง scaffold ตาม tech stack ที่ล็อก (#07) + โครงโปรเจกต์ (#16):

- Vite + React (JSX) + Tailwind CSS + React Router — SPA
- `vite-plugin-pwa` (installable, responsive มือถือ + iPad)
- โครง `netlify/functions/` + `netlify.toml` (รวม cron ของ scheduled function ตี 2–5 ไทย)
- ไฟล์ `.env.example` ตาม 5 env ใน deploy-plan
- จัดบ้านให้ repo `ARCHEMETIS/luiquest`; **เคลียร์เรื่องโฟลเดอร์ `new app/` → `luiquest/`** ที่ค้างจาก ticket #05 (rename ให้เรียบร้อยตอนนี้)

## เสร็จเมื่อ

`npm run dev` ขึ้นหน้าเปล่าได้ในเครื่อง, build ผ่าน, โครงโฟลเดอร์ตรงกับ deploy-plan — พร้อมรับ component ของเพื่อนและ function มาเสียบ
