# แผน deploy ลุยเควส (LuiQuest) บน Netlify + Supabase

> Asset ของ ticket [16-deploy-plan](../issues/16-deploy-plan.md) — สถานะ: **เอกสารแผน ยังไม่ลงมือทำจริง**
> Stack ล็อกตาม [07-tech-stack](../issues/07-tech-stack.md): Vite + React (JSX) + Tailwind + React Router, PWA (vite-plugin-pwa), Netlify Functions + Scheduled Function, Supabase (DB/Auth/cache)
> ข้อจำกัดตายตัว: **free tier เท่านั้น ห้ามเสียเงินแม้แต่บาทเดียว**

---

## 1. ภาพรวมสถาปัตยกรรม deploy

```
GitHub (ARCHEMETIS/luiquest, branch main)
        │  push → auto-deploy
        ▼
Netlify site: luiquest.netlify.app
├─ Static SPA (Vite build → dist/)  ← ผู้ใช้เปิดผ่านเว็บ/PWA
├─ Netlify Functions (/.netlify/functions/*)
│   ├─ chat.js               ← แชทโค้ช (จำกัด 10 ข้อความ/คน/วัน)
│   ├─ generate-quest.js     ← generate สดเฉพาะหัวข้อพิมพ์อิสระ
│   └─ pre-generate-quests.js ← Scheduled Function กลางคืน (cron)
│         │ service role key + Gemini key (ฝั่ง server เท่านั้น)
│         ▼
└─ Supabase (Postgres + Auth + RLS)
    ├─ Auth: Google Sign-in อย่างเดียว
    └─ ตาราง cache: roadmap ตลอดชีพ + เควสรายวัน pre-generate
```

หลักการเงินสำคัญที่สุด: **กลางวันผู้ใช้อ่านจาก Supabase ผ่าน function ล้วน ๆ ไม่แตะ Gemini** — Gemini ถูกเรียกแค่ (ก) รอบ pre-generate กลางคืน (ข) แชทโค้ช (ค) หัวข้อพิมพ์อิสระ

---

## 2. โครงโฟลเดอร์ repo `luiquest`

```
luiquest/
├─ index.html                  # entry ของ Vite
├─ package.json
├─ vite.config.js              # react plugin + vite-plugin-pwa
├─ tailwind.config.js          # (หรือ @tailwindcss/vite ถ้าใช้ Tailwind v4)
├─ postcss.config.js
├─ netlify.toml                # ดู section 3
├─ .env.example                # template env (commit ได้ ไม่มี secret จริง)
├─ .env                        # ค่า local dev จริง — ห้าม commit (.gitignore)
├─ .gitignore                  # node_modules/, dist/, .env, .netlify/
│
├─ public/                     # asset static (ไอคอน PWA ฯลฯ)
│   ├─ icon-192.png
│   ├─ icon-512.png
│   └─ apple-touch-icon.png
│
├─ src/
│   ├─ main.jsx                # mount React + Router
│   ├─ App.jsx                 # routes หลัก
│   ├─ lib/
│   │   ├─ supabaseClient.js   # createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
│   │   └─ api.js              # helper เรียก /.netlify/functions/*
│   ├─ pages/                  # Login, Onboarding, Quest, Leaderboard, Profile ...
│   ├─ components/             # จุด drop-in งานดีไซน์จากเพื่อน (React+Tailwind)
│   └─ hooks/                  # useAuth, useQuest ฯลฯ
│
├─ netlify/
│   └─ functions/
│       ├─ chat.js                 # โค้ช AI → flash-lite, เช็ค limit 10/วัน ใน Supabase
│       ├─ generate-quest.js       # generate สด (หัวข้อพิมพ์อิสระ) → gemini-3-flash
│       ├─ pre-generate-quests.js  # Scheduled Function — ดู cron ใน netlify.toml
│       └─ _shared/                # โมดูลใช้ร่วม (ไฟล์ขึ้นต้น _ ไม่ถูก deploy เป็น endpoint)
│           ├─ gemini.js           # fallback chain 3-flash → flash-lite → 2.5-flash → static
│           └─ supabaseAdmin.js    # createClient ด้วย SERVICE_ROLE_KEY
│
└─ supabase/
    └─ schema.sql               # จาก ticket 15 — รันใน SQL Editor ตอน setup
```

หมายเหตุ:
- ฟังก์ชันใน `netlify/functions/` ทุกไฟล์ `.js` ระดับบนสุดกลายเป็น endpoint อัตโนมัติ — โค้ดใช้ร่วมต้องอยู่ในโฟลเดอร์ย่อย (`_shared/`)
- โค้ดเก่าที่ก๊อปเป็นต้นแบบได้: `ml-quest/netlify/functions/chat.js`, `generate-quest.js` (แต่ต้องเปลี่ยนโมเดลเป็น gemini-3-flash/flash-lite และเพิ่ม auth check ต่อ user)

---

## 3. netlify.toml ตัวอย่างเต็ม

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"

# ── Scheduled Function: pre-generate เควสตอนกลางคืน ──
# Netlify ใช้ cron เป็น UTC เสมอ — เวลาไทย = UTC+7
# ตี 2 ถึงตี 5 เวลาไทย = 19:00–21:59 UTC (ของวันก่อนหน้า)
# รันทุก 10 นาทีในหน้าต่างนี้ = 18 รอบ/คืน (~540 invocations/เดือน)
# เหตุผลที่ไม่รันครั้งเดียว: function ฟรีมี timeout ~10 วิ + Gemini RPM ~10-15
# → แต่ละรอบดึงงานจากคิวใน Supabase มาทำทีละ batch เล็ก (~2-3 calls) แล้วจบ
[functions."pre-generate-quests"]
  schedule = "*/10 19-21 * * *"

# ── SPA fallback: ทุก path ที่ไม่ใช่ไฟล์จริงให้เสิร์ฟ index.html (React Router) ──
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# ── Header กันพลาด: อย่า cache service worker ──
[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"

[[headers]]
  for = "/manifest.webmanifest"
  [headers.values]
    Content-Type = "application/manifest+json"
```

จุดที่ต่างจาก `ml-quest/netlify.toml` เดิม:
- `publish = "dist"` + `command = "npm run build"` (เดิมเป็น static `publish = "."` ไม่มี build)
- เพิ่ม SPA fallback redirect (จำเป็นสำหรับ React Router — ไม่งั้น refresh หน้า /quest ได้ 404)
- เพิ่ม block `[functions."pre-generate-quests"]` พร้อม `schedule` (cron)
- ไม่ต้องมี redirect `/netlify/functions/*` แบบเดิม — frontend ใหม่เรียก `/.netlify/functions/...` ตรง ๆ

**การออกแบบ pre-generate ให้รอดใน free tier (สำคัญ):**
1. ตอนจบวัน (หรือ trigger แรกของคืน) ฟังก์ชันเขียน "คิวงาน" ลงตารางใน Supabase — รายชื่อ user ที่ต้องมีเควสของพรุ่งนี้
2. แต่ละรอบ cron (ทุก 10 นาที) หยิบงานจากคิวมา 2-3 รายการ → เรียก Gemini → เขียนผลลง cache → mark done — เสร็จใน <10 วิ แน่นอน
3. รอบสุดท้ายของคืน ถ้าคิวยังไม่หมด ผู้ใช้ที่ตกค้างจะ fallback ไป starter quest/เควสสำเร็จรูป (ตาม chain ใน ticket 03) — แอพไม่พังแน่นอน
4. capacity ต่อคืน: 18 รอบ × 3 calls = ~54 roadmap/เควสใหม่ต่อคืน — ถ้าผู้ใช้โตเกินนี้ค่อยขยายหน้าต่าง cron (เช่น `18-22`) ได้ฟรี ๆ

---

## 4. Environment variables

ตั้งใน **Netlify → Site configuration → Environment variables** (ใช้ scope เดียวทุก context ได้) และใส่ `.env` local สำหรับ `netlify dev`

| ตัวแปร | ค่า | อยู่ฝั่งไหน | หมายเหตุ |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` | client (ฝังใน bundle) | ปลอดภัย เป็น public โดยธรรมชาติ |
| `VITE_SUPABASE_ANON_KEY` | anon/publishable key | client (ฝังใน bundle) | ปลอดภัย **ต่อเมื่อเปิด RLS ทุกตาราง** (ticket 15) |
| `SUPABASE_URL` | เหมือนข้างบน | function เท่านั้น | ตัวเดียวกันแต่ไม่ prefix VITE_ ให้ function อ่าน |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key | **function เท่านั้น — ห้ามหลุดไป client เด็ดขาด** | ข้าม RLS ได้ทุกตาราง ใช้ใน pre-generate/เขียน cache |
| `GEMINI_API_KEY` | key จาก Google AI Studio | **function เท่านั้น — ห้ามหลุดไป client เด็ดขาด** | ถ้าหลุด = โควต้าฟรีโดนคนอื่นสูบหมด |

**กฎเหล็ก 2 ข้อ:**
1. Vite ฝังเฉพาะตัวแปรที่ขึ้นต้น `VITE_` ลง bundle → **ห้ามตั้งชื่อ secret ใด ๆ ขึ้นต้นด้วย `VITE_` เด็ดขาด** (แค่ตั้งชื่อผิดก็รั่วทันที)
2. `.env` จริงห้าม commit — commit เฉพาะ `.env.example`:

```bash
# .env.example — ก๊อปเป็น .env แล้วเติมค่าจริง (สำหรับ netlify dev)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # ห้าม commit / ห้ามใส่ VITE_
GEMINI_API_KEY=your-gemini-key                    # ห้าม commit / ห้ามใส่ VITE_
```

---

## 5. Flow deploy: GitHub → Netlify

**ครั้งแรก (setup ~15 นาที):**
1. สร้าง repo GitHub `ARCHEMETIS/luiquest` (public หรือ private ก็ได้ — free ทั้งคู่) แล้ว push โครงโปรเจกต์
2. Netlify → **Add new site → Import an existing project → GitHub** → เลือก `ARCHEMETIS/luiquest`
3. ตั้งค่า build (Netlify อ่านจาก `netlify.toml` ให้อยู่แล้ว แต่เช็คว่าตรง): branch `main`, command `npm run build`, publish `dist`
4. **Site configuration → Site details → Change site name → `luiquest`** → ได้ `https://luiquest.netlify.app` (ชื่อว่างหรือไม่ต้องเช็คตอนตั้ง ถ้าโดนจองแล้วใช้ `luiquest-app` สำรอง)
5. ใส่ env vars ทั้ง 5 ตัวตาม section 4
6. Deploy ครั้งแรก → เช็คว่า Scheduled Function ขึ้นใน **Logs → Functions** (จะเห็น `pre-generate-quests` พร้อม schedule)

**หลังจากนั้น (อัตโนมัติ):**
- push เข้า `main` → Netlify build + deploy อัตโนมัติ ทุกครั้ง
- เปิด PR → ได้ **Deploy Preview** URL (`deploy-preview-N--luiquest.netlify.app`) อัตโนมัติ — ระวังว่า preview ก็กิน build minutes; ถ้าใกล้เพดานปิดได้ที่ Site configuration → Build & deploy → Deploy Previews
- rollback: Deploys → เลือก deploy เก่า → **Publish deploy** (ฟรี ทันที)

**Local dev:** `netlify dev` (จาก `npm i -g netlify-cli` + `netlify link`) — รันทั้ง Vite และ functions ที่ `http://localhost:8888`; ทดสอบ scheduled function ด้วย `netlify functions:invoke pre-generate-quests`

---

## 6. เช็คลิสต์ตั้งค่า Supabase project ใหม่

> โปรเจกต์ **ใหม่แยกจาก ml-quest เดิม** (free tier ให้ 2 active projects — เดิม 1 + ใหม่ 1 พอดี)

1. [ ] supabase.com → New project: ชื่อ `luiquest`, region **Southeast Asia (Singapore)** (ใกล้ผู้ใช้ไทยที่สุด), ตั้ง DB password เก็บไว้
2. [ ] จด **Project URL** + **anon key** + **service_role key** จาก Settings → API (ไปใส่ env ตาม section 4)
3. [ ] SQL Editor → รัน `supabase/schema.sql` จาก ticket 15 (ตาราง users/quests/roadmap cache/chat limit + **เปิด RLS ทุกตาราง**)
4. [ ] Seed ข้อมูล starter quest 18 ชุด (6 หัวข้อ × 3 ระดับ — ticket 04) ลงตารางเควสสำเร็จรูป
5. [ ] Authentication → Providers → เปิด **Google** (ค่า Client ID/Secret จาก section 7)
6. [ ] Authentication → URL Configuration:
   - **Site URL**: `https://luiquest.netlify.app`
   - **Additional Redirect URLs**:
     - `http://localhost:8888/**` (netlify dev)
     - `http://localhost:5173/**` (vite dev เพียว)
     - `https://deploy-preview-*--luiquest.netlify.app/**` (ถ้าจะทดสอบ login บน preview)
7. [ ] ปิด provider Email/Password (ticket 04: Google อย่างเดียว) — Authentication → Providers → Email → disable

**กับดัก free tier ของ Supabase ที่ต้องรู้:** โปรเจกต์ **pause อัตโนมัติถ้าไม่มี activity ~7 วัน** — ของลุยเควสไม่น่าโดนเพราะ scheduled function ยิงเข้า DB ทุกคืนอยู่แล้ว (นับเป็น activity) แต่ช่วงพัฒนาแรก ๆ ก่อน cron ขึ้น ถ้าเงียบเกิน 7 วันต้องเข้า dashboard กด restore เอง

---

## 7. เช็คลิสต์ Google OAuth (สำหรับ Google Sign-in)

### ฝั่ง Google Cloud Console (ฟรี ไม่ต้องผูกบัตร)

1. [ ] console.cloud.google.com → สร้าง project ใหม่ชื่อ `luiquest` (หรือ reuse project ที่มี Gemini key ก็ได้ แต่แยกจะสะอาดกว่า)
2. [ ] **APIs & Services → OAuth consent screen**:
   - User type: **External**
   - App name: `ลุยเควส (LuiQuest)`, support email: อีเมลเจ้าของ
   - Scopes: แค่ default (`email`, `profile`, `openid`) — ไม่ต้องขอเพิ่ม จึง**ไม่ต้องผ่าน Google verification** (ใช้ได้เลยแบบ unverified แต่เพราะ scope เป็น non-sensitive จะไม่มีหน้าจอเตือนน่ากลัว)
   - Publishing status: กด **Publish app** (ถ้าปล่อยเป็น Testing โหมด user จะจำกัด 100 คนและ refresh token หมดอายุ 7 วัน — ขัดเป้ายอดผู้ใช้)
3. [ ] **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**, ชื่อ `luiquest-web`
   - **Authorized JavaScript origins**:
     - `https://luiquest.netlify.app`
     - `https://<project-ref>.supabase.co`
     - `http://localhost:8888`
     - `http://localhost:5173`
   - **Authorized redirect URIs** (ตัวที่สำคัญที่สุด — OAuth เด้งกลับเข้า Supabase ไม่ใช่เข้าแอพตรง ๆ):
     - `https://<project-ref>.supabase.co/auth/v1/callback`
4. [ ] จด **Client ID** + **Client Secret**

### ฝั่ง Supabase dashboard

5. [ ] Authentication → Providers → Google → Enable → วาง Client ID + Client Secret → Save
6. [ ] เช็ค URL Configuration ตาม section 6 ข้อ 6 (Site URL ผิด = login แล้วเด้งกลับ localhost บน production ซึ่งเป็นบั๊กคลาสสิก)

### ฝั่งโค้ด (ตอน implement)

```js
// ต้องส่ง redirectTo เสมอ ไม่งั้นจะกลับไป Site URL อย่างเดียว (localhost จะพัง)
supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: window.location.origin },
});
```

### ทดสอบ

7. [ ] localhost: `netlify dev` → กด Sign in → เลือกบัญชี Google → กลับมาที่ `localhost:8888` พร้อม session
8. [ ] production: ทำซ้ำบน `luiquest.netlify.app`
9. [ ] เช็คว่าชื่อ + รูปโปรไฟล์จาก Google เข้า `user_metadata` (ticket 04: ไม่ถามซ้ำ)

---

## 8. Free tier: เพดานที่ต้องรู้ (ณ ก.ค. 2026 — เช็คหน้า pricing อีกทีตอน implement)

### Netlify Free
| รายการ | เพดาน/เดือน | ใช้จริงโดยประมาณ | ความเสี่ยง |
|---|---|---|---|
| Function invocations | 125,000 | cron ~540 + ผู้ใช้ 300 คน/วัน × ~10 calls = ~90k | ต่ำ–กลาง: ถ้าผู้ใช้โตเกิน ~400 active/วัน ให้ลด call ฝั่ง client (อ่าน Supabase ตรงผ่าน anon+RLS แทนการผ่าน function ในงานอ่านล้วน) |
| Function runtime | 100 ชั่วโมง | น้อยมาก (function สั้น ๆ) | ต่ำ |
| Function timeout | ~10 วิ/ครั้ง (sync) | ออกแบบ batch เล็กรองรับแล้ว (sec.3) | จัดการแล้ว |
| Build minutes | 300 นาที | build Vite ~1-2 นาที × push | กลาง: push ถี่ + deploy preview เปลืองเร็ว — ปิด preview ได้ถ้าจำเป็น |
| Bandwidth | 100 GB | SPA เล็ก + PWA cache ช่วย | ต่ำ |
| **Background Functions (15 นาที)** | **ไม่มีในแผนฟรี** | — | **ห้ามพึ่ง** — เหตุผลที่ pre-generate ต้องเป็น cron ถี่ batch เล็ก |

### Supabase Free
- Database 500 MB / Egress 5 GB / **Auth 50,000 MAU** (เหลือเฟือ) / 2 active projects
- **Pause หลัง ~7 วันไม่มี activity** (ดู sec.6) — cron กลางคืนกันไว้ให้โดยธรรมชาติ
- ไม่มี daily backup ในแผนฟรี → ตอนมีผู้ใช้จริงแล้ว dump schema+data เก็บเป็นระยะด้วย SQL Editor / pg_dump

### Gemini Free (สรุปจาก ticket 03)
- Planning number: `gemini-3-flash` ~1,500 RPD, `flash-lite` ~1,000 RPD, `2.5-flash` ~250 RPD; RPM ทุกตัว ~10-15
- ตัวเลขจริงดูได้ที่ AI Studio rate-limit dashboard เท่านั้น — **เช็ค 5 นาทีตอนเริ่ม implement**
- API key สร้างจาก AI Studio **โดยไม่ผูก billing** — ถ้าไม่ผูกบัตร โปรเจกต์เกินโควต้าแค่ 429 ไม่มีทางโดนเก็บเงิน (นี่คือ safety net ของข้อจำกัด "ห้ามเสียเงิน")

---

## 9. ลำดับลงมือจริง (สำหรับ effort ถัดไป)

1. สร้าง repo `ARCHEMETIS/luiquest` + scaffold Vite+React+Tailwind + `netlify.toml` ตาม sec.2-3
2. สร้าง Supabase project + รัน schema + seed starter quests (sec.6 ข้อ 1-4)
3. ตั้ง Google OAuth (sec.7) ← **ต้องให้เจ้าของทำเองบางขั้น (บัญชี Google)**
4. เชื่อม Netlify กับ repo + ตั้งชื่อ site + env vars (sec.5)
5. ทดสอบ login localhost → deploy → ทดสอบ login production
6. เขียน functions (chat / generate-quest / pre-generate-quests) + ทดสอบ cron ด้วย `netlify functions:invoke`
7. เช็ค AI Studio dashboard เทียบ planning numbers → ปรับ batch size ของ cron ถ้าจำเป็น
