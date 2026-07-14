# วิธีทำงานร่วมกัน (LuiQuest)

คู่มือสั้นๆ สำหรับ 2 คน — ไม่ต้องจำ อ่านตอนจะใช้ก็พอ

## ใครทำอะไร

| พื้นที่ | คนทำ | หมายเหตุ |
|---|---|---|
| `src/pages/`, `src/components/` | **เพื่อน (frontend)** | หน้าตา/UI ทั้งหมด ไม่ต้องรอใคร ทำเต็มที่ |
| `src/lib/`, `src/hooks/`, `netlify/`, `supabase/` | **เจ้าของ + Claude** | ต่อ API, auth, database, AI |

แยกกันคนละโฟลเดอร์ → **ไม่ค่อยชนกัน**

⚠️ ไฟล์เดียวที่อาจต้องแตะร่วมกัน: `src/App.jsx` (routing) — ก่อนแก้ไฟล์นี้ ทักในแชทก่อนว่าจะแก้ กันสองคนแก้พร้อมกัน

## Setup ครั้งแรก (เพื่อนทำครั้งเดียว)

```
git clone https://github.com/ARCHEMETIS/luiquest.git
cd luiquest
npm install
```

ขอค่า `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY` จากเจ้าของ (ทางแชทได้ ปลอดภัย) แล้วสร้างไฟล์ `.env` จาก `.env.example`

**ห้ามขอ/ห้ามใช้** `SUPABASE_SERVICE_ROLE_KEY` หรือ `GEMINI_API_KEY` — เป็นของฝั่ง backend เท่านั้น frontend ไม่ต้องใช้

รันแอพทดสอบ:
```
npm run dev
```

## ทำงานแต่ละครั้ง (ทำแบบนี้ทุกรอบ)

```
git checkout main
git pull
git checkout -b frontend/ชื่อสั้นๆบอกว่าทำอะไร
```

แก้โค้ด → เสร็จแล้ว:

```
git add .
git commit -m "อธิบายสั้นๆ ว่าทำอะไร"
git push -u origin frontend/ชื่อสั้นๆบอกว่าทำอะไร
```

เปิด https://github.com/ARCHEMETIS/luiquest จะมีปุ่ม **Compare & pull request** โผล่ขึ้นมาเอง → กด → ใส่คำอธิบายสั้นๆ → กด **Create pull request**

อีกคนเข้าไปกด **Review** → ถ้าโอเคกด **Merge** → กด **Delete branch**

จากนั้นทั้งคู่กลับไป `git checkout main && git pull` ก่อนเริ่มงานชิ้นใหม่เสมอ

## ถ้าเจอคำว่า "CONFLICT"

เปิดไฟล์ที่ชน จะเห็น:
```
<<<<<<< HEAD
โค้ดของเรา
=======
โค้ดของอีกคน
>>>>>>> branch-name
```
เลือก/รวมโค้ดที่ถูกต้อง ลบเครื่องหมาย `<<<<<<<` `=======` `>>>>>>>` ออก แล้ว:
```
git add .
git commit
```
ทำต่อได้ปกติ ไม่ต้องตกใจ เกิดขึ้นเป็นเรื่องปกติ
