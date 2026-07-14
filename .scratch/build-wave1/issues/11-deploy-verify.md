# Deploy production + ทดสอบ end-to-end บน luiquest.netlify.app

Type: task
Status: open
Blocked by: 08, 09, 10

## งานที่ต้องทำ

ปล่อยขึ้น production และพิสูจน์ว่าใช้ได้จริง (= ถึง Destination ของ map):

- ตั้ง env 5 ตัวบน Netlify (service_role/Gemini ห้าม `VITE_`)
- ตั้ง redirect URI ของ Google OAuth ให้ตรง domain production
- ตรวจ PWA ติดตั้งได้จริงบนมือถือ + iPad
- ไล่ลูปเต็มบน production ด้วยบัญชีจริง: สมัคร Google → onboarding → เควส → ได้ XP → แชท → ลิงก์ชวน → /stats
- เช็ค scheduled function รันคืนแรกจริง

## เสร็จเมื่อ

คนแปลกหน้าเปิด `luiquest.netlify.app` แล้วสมัคร-เล่นได้ครบลูปโดยไม่พัง, activity_log เก็บ event ครบ — **ประกาศ Wave 1 live ได้**
