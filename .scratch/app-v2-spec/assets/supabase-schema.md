# Schema Supabase สำหรับ ลุยเควส (LuiQuest)

เอกสารออกแบบ schema Postgres/Supabase (ยังไม่รันจริง — implementation เป็น effort ถัดไป) จาก ticket [ออกแบบ schema Supabase](../issues/15-supabase-schema.md)

รวบ input จาก: [#13 เก็บเงินจริง](../issues/13-real-monetization.md) (payments + is_premium/premium_until + bucket payment-slips), [#14 นับผู้ใช้จริง](../issues/14-user-count-evidence.md) (activity_log + timestamp ต่อ event), [#04 login/onboarding](../issues/04-login-onboarding.md) (Google-only, starter quests 18 ชุด), [#06 MVP](../issues/06-mvp-features.md), [#03 โควต้า Gemini](../issues/03-gemini-quota-research.md) (cache roadmap ตลอดชีพ, pre-generate เควส), [#07 tech stack](../issues/07-tech-stack.md) (Supabase = DB/Auth/cache)

**ต่อจากของเดิม `ml-quest/supabase-schema.sql`** (single-user) — ยกแนวคิด XP/streak/quest/chat มา แต่ทำใหม่เป็น multi-user + RLS ต่อผู้ใช้

---

## หลักการออกแบบ (สรุปก่อนเข้า DDL)

1. **id เป็น `uuid`** ทุกตารางที่ผูกกับผู้ใช้ (คงแนวเดิมจาก ml-quest ตาม memory quirk) — ยกเว้น `activity_log` และ `chat_messages` ใช้ `bigint generated always as identity` เพราะเป็นตาราง append-only ปริมาณสูง (ถูกกว่า/เร็วกว่า)
2. **`phase_number` เป็น `integer`** (คง quirk เดิม: phase เป็น integer)
3. **timestamp ต่อ event ตั้งแต่วันแรก** — ทุกตารางที่เป็น metric มี `created_at`/`completed_at`/`submitted_at`/`verified_at` (คำเตือนหลักจาก #14: ถ้าลืม จะทำ "กราฟโต" ตอน pitch ไม่ได้)
4. **RLS เปิดทุกตาราง** — ต่างจาก ml-quest เดิม (ที่เปิด anon full-access เพราะ single-user). แอพนี้ทุก query ผูกกับ `auth.uid()`
5. **Aggregate สาธารณะ (`/stats`) และ leaderboard = VIEW** ไม่ใช่ตาราง — view ใน Supabase รันด้วยสิทธิ owner (bypass RLS) จึงเปิดให้อ่าน aggregate ได้โดยไม่หลุด PII (เลือกเฉพาะคอลัมน์ปลอดภัย)
6. **โควต้า Gemini**: roadmap cache ตลอดชีพ (unique ต่อ user×topic), daily_quests ถูก pre-generate โดย Scheduled Function ที่ยิงด้วย **service role key** (bypass RLS) — กลางวัน frontend อ่าน DB ล้วน
7. **การเขียนที่ผู้ใช้ห้ามทำเอง** (flip `is_premium`, ให้ XP referral, verify payment, insert daily_quests) ทำผ่าน **Netlify Function ที่ใช้ service role key** ซึ่ง bypass RLS — RLS ที่เขียนไว้คือด่านกันฝั่ง client (anon key) เท่านั้น

---

## แผนผังตาราง (ภาพรวม)

| ตาราง | หน้าที่ | Wave |
|---|---|---|
| `profiles` | ต่อจาก auth.users: XP/streak/grade/is_premium/premium_until/last_active_at/referral_code | 1 |
| `topics` | lookup 6 หัวข้อ curated | 1 |
| `roadmaps` | roadmap ต่อ user ต่อหัวข้อ (cache ตลอดชีพ) + flag active | 1 |
| `phases` | phase ในแต่ละ roadmap (phase_number integer) | 1 |
| `daily_quests` | เควสรายวัน (pre-generated กลางคืน) | 1 |
| `quest_checklist_items` | checklist ต่อเควส (gating ติ๊กครบถึงได้ XP) | 1 |
| `quest_completions` | บันทึกการทำเควสเสร็จ (มี `completed_at` = metric activated + กราฟ) | 1 |
| `starter_quests` | คลัง 18 ชุด (6 หัวข้อ × 3 ระดับ) seed สำเร็จรูป | 1 |
| `referrals` | ใครสมัครผ่านใคร + XP ทั้งคู่ | 1 |
| `chat_messages` | แชทโค้ช AI (นับลิมิต 10/วัน จากตารางนี้) | 1 |
| `payments` | บันทึกจ่ายเงิน PromptPay (ตาม #13) | 2 |
| `activity_log` | event log เบา ๆ (user_id, event_type, created_at) → DAU/กราฟโต | 1 |
| `friendships` | เพื่อน/duo (เตรียมไว้) | 2 |
| `push_subscriptions` | web push endpoint (เตรียมไว้) | 2 |
| **VIEW** `leaderboard` | อันดับ XP รวม (ไม่ใช่ตาราง) | 1 |
| **VIEW** `public_stats` | aggregate สำหรับ /stats | 1 |
| **VIEW** `stats_daily_growth` | ยอดผู้ใช้สะสมรายวัน (กราฟโต) | 1 |

Storage bucket: **`payment-slips`** (private)

---

## SQL DDL

### 0) Extension + helper

```sql
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- helper: เช็คว่า user ปัจจุบันเป็น admin (เจ้าของ) ไหม — ใช้ในหลาย RLS policy
-- bootstrap admin คนแรก: update profiles set is_admin = true where id = '<owner-uuid>' (ทำมือครั้งเดียว)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;
```

### 1) `profiles` — ต่อจาก auth.users

```sql
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  display_name        text,                       -- ดึงจาก Google
  avatar_url          text,                       -- ดึงจาก Google
  total_xp            integer not null default 0,
  current_streak      integer not null default 0,
  longest_streak      integer not null default 0,
  last_quest_date     date,                        -- ใช้คำนวณ streak (ต่อเนื่อง/ขาด)
  last_active_at      timestamptz,                 -- อัปเดตทุกครั้งเปิดแอพ → ใช้ทำ DAU สำรอง (#14)
  grade               text,                        -- letter grade A/B/C... (คำนวณจาก progress)
  is_premium          boolean not null default false,   -- flag หลักที่ทุก gating เช็ค (#13)
  premium_until       timestamptz,                 -- วันหมดสิทธิ (now + 1 เดือน ต่อรอบจ่าย) — auto-expire runway สั้น (#13)
  referral_code       text unique not null,        -- โค้ดของ user เองไว้ให้คนอื่นสมัครผ่าน
  referred_by         uuid references public.profiles(id) on delete set null,  -- สมัครผ่านใคร
  leaderboard_opt_out boolean not null default false,  -- privacy: ซ่อนจาก leaderboard (#14 flag 4)
  is_admin            boolean not null default false,  -- true = เจ้าของ (ใช้ verify payment/admin)
  created_at          timestamptz not null default now()  -- = Registered metric (#14)
);

create index idx_profiles_total_xp on public.profiles(total_xp desc);
create index idx_profiles_created_at on public.profiles(created_at);
```

**Trigger สร้าง profile อัตโนมัติเมื่อมี auth.users ใหม่** (Google sign-in) — ดึงชื่อ/รูปจาก metadata + สุ่ม referral_code:

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    'LQ' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6))  -- เช่น LQ9F3A2C
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 2) `topics` — 6 หัวข้อ curated

```sql
create table public.topics (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,     -- python | data-ml | web | ai-tools | excel | finance
  title        text not null,            -- ชื่อไทยแสดงผล
  description  text,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
```

### 3) `roadmaps` — cache ตลอดชีพ ต่อ user ต่อหัวข้อ

```sql
create table public.roadmaps (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  topic_id         uuid references public.topics(id) on delete set null,  -- null = หัวข้อพิมพ์อิสระ
  topic_title      text not null,        -- ชื่อหัวข้อ (curated หรือ freeform) ไว้แสดง
  level            text not null check (level in ('beginner','intermediate','advanced')),  -- มือใหม่/พอมีพื้น/แน่น
  minutes_per_day  integer not null check (minutes_per_day in (15,30,60)),  -- จาก onboarding ขั้น 3
  content          jsonb,                -- โครง roadmap ที่ AI generate (สรุป/metadata) — cache ตลอดชีพ (#03)
  status           text not null default 'ready' check (status in ('generating','ready','failed')),  -- freeform gen สด
  is_active        boolean not null default true,   -- ฟรี = active ได้ 1, premium = หลายอัน (#06/#13)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- cache ตลอดชีพ: 1 roadmap ต่อ user ต่อ curated topic (พิมพ์อิสระ topic_id=null ไม่ติด constraint นี้)
create unique index uniq_roadmap_user_topic
  on public.roadmaps(user_id, topic_id)
  where topic_id is not null;

create index idx_roadmaps_user on public.roadmaps(user_id);
create index idx_roadmaps_active on public.roadmaps(user_id) where is_active;
```

**Trigger บังคับ active roadmap limit** (ฟรี 1 หัวข้อ) — belt-and-suspenders คู่กับ app logic (ดูหัวข้อ "การบังคับ limit" ท้ายเอกสาร):

```sql
create or replace function public.enforce_active_roadmap_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_prem boolean;
  active_count integer;
begin
  if new.is_active then
    select is_premium into is_prem from public.profiles where id = new.user_id;
    if not coalesce(is_prem, false) then
      select count(*) into active_count
      from public.roadmaps
      where user_id = new.user_id and is_active and id <> new.id;
      if active_count >= 1 then
        raise exception 'FREE_PLAN_ACTIVE_ROADMAP_LIMIT';  -- ฟรีมี active ได้ทีละ 1
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_active_roadmap_limit
  before insert or update of is_active on public.roadmaps
  for each row execute function public.enforce_active_roadmap_limit();
```

### 4) `phases` — phase ใน roadmap

```sql
create table public.phases (
  id            uuid primary key default gen_random_uuid(),
  roadmap_id    uuid not null references public.roadmaps(id) on delete cascade,
  phase_number  integer not null,        -- คง quirk: phase เป็น integer
  title         text not null,
  description   text,
  created_at    timestamptz not null default now(),
  unique (roadmap_id, phase_number)
);

create index idx_phases_roadmap on public.phases(roadmap_id);
```

### 5) `daily_quests` — เควสรายวัน (pre-generated)

```sql
create table public.daily_quests (
  id             uuid primary key default gen_random_uuid(),
  roadmap_id     uuid not null references public.roadmaps(id) on delete cascade,
  phase_id       uuid references public.phases(id) on delete set null,
  day_number     integer not null,       -- ลำดับวันใน roadmap
  scheduled_date date,                    -- วันที่ควรโผล่ (pre-generate กลางคืน) — null = ยืดหยุ่นตาม pace ผู้ใช้
  title          text not null,
  description    text,
  content        jsonb,                   -- เนื้อเควสเต็ม (objectives, แหล่งเรียน ฯลฯ)
  xp_reward      integer not null default 10,
  source_starter_id uuid references public.starter_quests(id) on delete set null,  -- ถ้าก๊อปจาก starter
  created_at     timestamptz not null default now(),
  unique (roadmap_id, day_number)         -- กันสร้างซ้ำตอน pre-generate ยิงพร้อมกัน (บทเรียนจาก ml-quest)
);

create index idx_daily_quests_roadmap on public.daily_quests(roadmap_id);
create index idx_daily_quests_date on public.daily_quests(scheduled_date);
```

> NOTE ลำดับ FK: `starter_quests` (ข้อ 8) ต้องถูก `create` ก่อน `daily_quests` เพราะมี FK ชี้ไปหา หรือเพิ่ม FK ทีหลังด้วย `alter table` — ตอนรันจริงจัดลำดับให้ starter_quests มาก่อน

### 6) `quest_checklist_items` — checklist ต่อเควส (gating)

```sql
create table public.quest_checklist_items (
  id           uuid primary key default gen_random_uuid(),
  quest_id     uuid not null references public.daily_quests(id) on delete cascade,
  order_index  integer not null default 0,
  label        text not null,
  link_url     text,                     -- ลิงก์แหล่งเรียน (whitelist/ค้นหาเท่านั้น ตาม #02)
  created_at   timestamptz not null default now()
);

create index idx_checklist_quest on public.quest_checklist_items(quest_id);
```

> การติ๊ก checklist ระหว่างทำเควส (ยังไม่จบ) เก็บ state ฝั่ง client/local ได้ — พอกดจบเควส backend ตรวจว่าติ๊กครบแล้ว snapshot ลง `quest_completions.checked_items` (jsonb) เพื่อ audit gating "ติ๊กครบถึงได้ XP" โดยไม่ต้องมีตาราง per-item-per-user เพิ่ม

### 7) `quest_completions` — บันทึกทำเควสเสร็จ (metric หัวใจ)

```sql
create table public.quest_completions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  quest_id      uuid not null references public.daily_quests(id) on delete cascade,
  roadmap_id    uuid not null references public.roadmaps(id) on delete cascade,  -- denormalize เพื่อ query เร็ว
  xp_earned     integer not null default 0,
  checked_items jsonb,                   -- snapshot ids ที่ติ๊ก (audit gating)
  completed_at  timestamptz not null default now(),  -- ★ metric: activated + กราฟเควสรายวัน (#14)
  unique (user_id, quest_id)             -- ทำเควสเดิมซ้ำไม่ได้
);

create index idx_completions_user on public.quest_completions(user_id);
create index idx_completions_completed_at on public.quest_completions(completed_at);
```

> **Activated (#14)** = user ที่มี ≥ 1 แถวในตารางนี้. `completed_at` คือ timestamp ที่ทำให้ทำกราฟเควสรายวันย้อนหลังได้ — ห้ามลืม

### 8) `starter_quests` — คลัง 18 ชุด (seed สำเร็จรูป)

```sql
create table public.starter_quests (
  id           uuid primary key default gen_random_uuid(),
  topic_id     uuid not null references public.topics(id) on delete cascade,
  level        text not null check (level in ('beginner','intermediate','advanced')),
  title        text not null,
  description  text,
  content      jsonb,                    -- เนื้อเควสเต็ม
  checklist    jsonb,                    -- checklist items (embed ในนี้ ตอนก๊อปค่อยแตกเป็นแถว)
  xp_reward    integer not null default 10,
  created_at   timestamptz not null default now(),
  unique (topic_id, level)               -- 6 หัวข้อ × 3 ระดับ = 18 ชุด ไม่ซ้ำ
);
```

> ตอน onboarding: user เลือกหัวข้อ+ระดับ → ระบบก๊อป `starter_quests(topic_id, level)` เป็น `daily_quests` แถวแรกของ roadmap (day_number=1) ทันที **ไม่กินโควต้า Gemini** (#04); roadmap เต็มค่อย generate เบื้องหลัง/รอบกลางคืน

### 9) `referrals` — ชวนเพื่อน (track + XP ทั้งคู่)

```sql
create table public.referrals (
  id                  uuid primary key default gen_random_uuid(),
  referrer_id         uuid not null references public.profiles(id) on delete cascade,  -- คนชวน
  referred_id         uuid not null references public.profiles(id) on delete cascade,  -- คนถูกชวน
  referrer_xp_awarded integer not null default 0,
  referred_xp_awarded integer not null default 0,
  created_at          timestamptz not null default now(),
  unique (referred_id)   -- แต่ละคนถูกนับว่าสมัครผ่านคนอื่นได้ครั้งเดียว (กันปั๊ม XP)
);

create index idx_referrals_referrer on public.referrals(referrer_id);
```

> `profiles.referral_code` = โค้ดของ user; `profiles.referred_by` = ชี้คนชวน (denormalize ไว้ join ง่าย). ตาราง `referrals` เก็บ event + XP ที่จ่าย. การให้ XP ทั้งคู่ทำผ่าน **service role function** (ผู้ใช้เขียนเองไม่ได้ กันโกง)

### 10) `chat_messages` — แชทโค้ช AI (ลิมิต 10/วัน)

```sql
create table public.chat_messages (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  roadmap_id  uuid references public.roadmaps(id) on delete cascade,
  quest_id    uuid references public.daily_quests(id) on delete set null,
  role        text not null check (role in ('user','assistant')),
  message     text not null,
  created_at  timestamptz not null default now()
);

create index idx_chat_user_date on public.chat_messages(user_id, created_at);
```

> **ลิมิต 10/วัน** (#03/#13): นับ `count(*) where user_id = :uid and role='user' and created_at >= date_trunc('day', now())`. ถ้า `is_premium` → ไม่จำกัด (แนะนำ soft cap ~100/วัน กัน abuse ตาม #13 flag 6). บังคับใน Netlify Function ก่อนเรียก Gemini

### 11) `payments` — จ่ายเงิน PromptPay (ตาม #13)

```sql
create table public.payments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  ref_code      text unique not null,     -- LQ-XXXX ใส่หมายเหตุโอน / match คน↔ยอด
  amount        integer not null default 39,   -- บาท/เดือน (เก็บฟิลด์ไว้เผื่อปรับ 29/59 — #13 flag 3)
  status        text not null default 'pending'
                check (status in ('pending','submitted','verified','rejected')),
  slip_url      text,                     -- path รูปสลิปใน bucket payment-slips
  reject_reason text,
  created_at    timestamptz not null default now(),
  submitted_at  timestamptz,              -- ตอนอัปสลิป
  verified_at   timestamptz,              -- ตอน admin กด verify
  verified_by   uuid references public.profiles(id) on delete set null  -- admin ที่ verify (audit)
);

create index idx_payments_user on public.payments(user_id);
create index idx_payments_status on public.payments(status);

-- กันจ่ายซ้ำซ้อน: 1 user มี payment ที่ยังค้าง (pending/submitted) ได้ทีละ 1 (#13 edge case)
create unique index uniq_open_payment_per_user
  on public.payments(user_id)
  where status in ('pending','submitted');
```

> flow: pending (กดสมัคร) → submitted (อัปสลิป) → verified (admin ยืนยัน → เซ็ต `profiles.is_premium=true` + `premium_until`) / rejected. การ flip `is_premium` และเซ็ต `verified_*` ทำผ่าน **service role / admin function** เท่านั้น

### 12) `activity_log` — event log (DAU/กราฟโต) ★ สำคัญมากตาม #14

```sql
create table public.activity_log (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  event_type  text not null,   -- login | quest_complete | chat | roadmap_start | share | referral_signup | premium_submit ...
  metadata    jsonb,           -- payload เสริม (เช่น topic, quest_id) — optional
  created_at  timestamptz not null default now()  -- ★ ต้องมีตั้งแต่ deploy วันแรก ไม่งั้นกราฟ DAU ย้อนหลังหาย
);

create index idx_activity_user_date on public.activity_log(user_id, created_at);
create index idx_activity_type_date on public.activity_log(event_type, created_at);
```

> **DAU** = `count(distinct user_id) where created_at::date = :day`. ตารางนี้คือ "ตัวที่พลาดง่ายสุด" ที่ #14 ย้ำ — ต้องเก็บ raw event ตั้งแต่ commit แรกแม้ยังไม่มีหน้าแสดงผล. เขียน event ผ่าน function/insert ของ user เอง (RLS: insert เฉพาะแถวตัวเอง)

### 13) Wave 2 — เตรียมตารางไว้ (ยังไม่ใช้ Wave 1)

```sql
-- เพื่อน/duo (เห็น streak กัน) — #06 Wave 2
create table public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending','accepted','blocked')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
create index idx_friend_addressee on public.friendships(addressee_id);

-- web push subscription (กัน streak ขาด) — #06 Wave 2
create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,     -- key สำหรับ encrypt payload
  auth       text not null,
  created_at timestamptz not null default now()
);
create index idx_push_user on public.push_subscriptions(user_id);
```

---

## VIEWS — leaderboard + /stats (aggregate สาธารณะ)

View ใน Supabase (Postgres) รันด้วยสิทธิ owner (`security_invoker` = off โดย default) จึง **bypass RLS** — ใช้เปิด aggregate สาธารณะได้โดยเลือกเฉพาะคอลัมน์ปลอดภัย ไม่หลุด PII

```sql
-- Leaderboard: อันดับ XP รวมทั้งแอพ (#06) — เคารพ opt-out, โชว์ badge premium (#13)
create view public.leaderboard as
select
  row_number() over (order by total_xp desc, created_at asc) as rank,
  id as user_id,
  display_name,
  avatar_url,
  total_xp,
  current_streak,
  is_premium               -- ใช้โชว์ badge "ผู้สนับสนุน" (social proof)
from public.profiles
where leaderboard_opt_out = false;

-- Public stats: aggregate สำหรับหน้า /stats (#14) — ไม่มี PII เลย
create view public.public_stats as
select
  (select count(*) from public.profiles) as registered_total,
  (select count(distinct user_id) from public.quest_completions) as activated_total,
  (select count(*) from public.quest_completions) as quests_completed_total,
  (select coalesce(max(longest_streak), 0) from public.profiles) as max_streak,
  (select coalesce(round(avg(current_streak), 1), 0) from public.profiles
     where current_streak > 0) as avg_active_streak,
  (select count(distinct user_id) from public.activity_log
     where created_at >= date_trunc('day', now())) as dau_today;

-- กราฟโต: ยอดผู้ใช้สะสมรายวัน (#14 — เส้นโตขึ้นเรื่อย ๆ ที่ pitch ต้องการ)
create view public.stats_daily_growth as
select
  d::date as day,
  (select count(*) from public.profiles p where p.created_at::date <= d::date) as cumulative_users
from generate_series(
  (select min(created_at)::date from public.profiles),
  current_date,
  interval '1 day'
) d;
```

**สิทธิ์อ่าน view:**

```sql
grant select on public.public_stats     to anon, authenticated;  -- /stats เปิดสาธารณะ (อาจารย์เปิดลิงก์ดูได้)
grant select on public.stats_daily_growth to anon, authenticated;
grant select on public.leaderboard       to authenticated;        -- leaderboard เฉพาะคนล็อกอิน
```

> ทำไม view ปลอดภัย: เลือกเฉพาะคอลัมน์ที่โชว์ได้ (`display_name`, `avatar_url`, `total_xp`) — ไม่มี email/is_admin/referral internal. `public_stats`/`stats_daily_growth` เป็นตัวเลขล้วน 0 PII ตาม #14 ข้อ 4. ถ้าอยากเข้มขึ้น (กันคนดึง view ดิบ) เปลี่ยน view เป็น RPC function `security definer` ที่คืนเฉพาะ aggregate ก็ได้ — แต่ view พอสำหรับสเกลวิชานี้

---

## นโยบาย RLS ต่อทุกตาราง

เปิด RLS ทุกตารางก่อน:

```sql
alter table public.profiles              enable row level security;
alter table public.topics                enable row level security;
alter table public.roadmaps              enable row level security;
alter table public.phases                enable row level security;
alter table public.daily_quests          enable row level security;
alter table public.quest_checklist_items enable row level security;
alter table public.quest_completions     enable row level security;
alter table public.starter_quests        enable row level security;
alter table public.referrals             enable row level security;
alter table public.chat_messages         enable row level security;
alter table public.payments              enable row level security;
alter table public.activity_log          enable row level security;
alter table public.friendships           enable row level security;
alter table public.push_subscriptions    enable row level security;
```

### profiles

```sql
-- อ่านได้เฉพาะแถวตัวเอง (การโชว์คนอื่นไปทาง view leaderboard ที่ bypass RLS)
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

-- อัปเดตได้เฉพาะแถวตัวเอง — แต่ห้ามแก้ is_premium/premium_until/is_admin/total_xp เอง
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_premium  = (select is_premium  from public.profiles where id = auth.uid())
    and premium_until is not distinct from (select premium_until from public.profiles where id = auth.uid())
    and is_admin    = (select is_admin    from public.profiles where id = auth.uid())
    and total_xp    = (select total_xp    from public.profiles where id = auth.uid())
  );

-- admin อ่านได้ทุกแถว (หน้า admin)
create policy "profiles_select_admin" on public.profiles
  for select to authenticated using (public.is_admin());
```

> INSERT ไม่ต้องมี policy เพราะ profile ถูกสร้างด้วย trigger `handle_new_user` (security definer). การเขียน `is_premium`/`total_xp`/XP referral ทำผ่าน **service role key** (bypass RLS ทั้งหมด) — WITH CHECK ข้างบนกันแค่ client (anon key) ยกสิทธิตัวเอง

### topics + starter_quests (อ่านสาธารณะ, เขียนเฉพาะ admin/seed)

```sql
create policy "topics_select_all" on public.topics
  for select to anon, authenticated using (is_active);

create policy "starter_quests_select_all" on public.starter_quests
  for select to anon, authenticated using (true);  -- ต้องอ่านได้ตอน onboarding

create policy "topics_write_admin" on public.topics
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "starter_quests_write_admin" on public.starter_quests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
```

### roadmaps / phases / daily_quests / quest_checklist_items (เจ้าของ roadmap เท่านั้น)

```sql
-- roadmaps: เจ้าของ CRUD ของตัวเอง (limit active บังคับด้วย trigger + app logic)
create policy "roadmaps_all_own" on public.roadmaps
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- phases: ผูกผ่าน roadmap ownership
create policy "phases_all_own" on public.phases
  for all to authenticated
  using (exists (select 1 from public.roadmaps r where r.id = roadmap_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.roadmaps r where r.id = roadmap_id and r.user_id = auth.uid()));

-- daily_quests: อ่าน/แก้เฉพาะเควสใน roadmap ตัวเอง (insert จริงทำโดย service role ตอน pre-generate)
create policy "daily_quests_all_own" on public.daily_quests
  for all to authenticated
  using (exists (select 1 from public.roadmaps r where r.id = roadmap_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.roadmaps r where r.id = roadmap_id and r.user_id = auth.uid()));

-- checklist items: ผ่าน quest → roadmap → user
create policy "checklist_all_own" on public.quest_checklist_items
  for all to authenticated
  using (exists (
    select 1 from public.daily_quests q
    join public.roadmaps r on r.id = q.roadmap_id
    where q.id = quest_id and r.user_id = auth.uid()))
  with check (exists (
    select 1 from public.daily_quests q
    join public.roadmaps r on r.id = q.roadmap_id
    where q.id = quest_id and r.user_id = auth.uid()));
```

### quest_completions (เจ้าของ — insert/select own; แก้ไม่ได้)

```sql
create policy "completions_select_own" on public.quest_completions
  for select to authenticated using (auth.uid() = user_id);

create policy "completions_insert_own" on public.quest_completions
  for insert to authenticated with check (auth.uid() = user_id);
-- ไม่มี update/delete policy → ทำเควสเสร็จแล้วแก้ประวัติไม่ได้ (metric สะอาด)
```

> aggregate สำหรับ /stats ไปทาง view `public_stats` ที่ bypass RLS แล้ว — ไม่ต้องเปิด select public บนตารางดิบ

### referrals (คู่ที่เกี่ยวข้องอ่านได้; เขียนโดย service role)

```sql
create policy "referrals_select_involved" on public.referrals
  for select to authenticated
  using (auth.uid() = referrer_id or auth.uid() = referred_id);
-- insert/update ไม่เปิดให้ client — ทำผ่าน service role function (ให้ XP ทั้งคู่, กันปั๊ม)
```

### chat_messages (เจ้าของเท่านั้น)

```sql
create policy "chat_select_own" on public.chat_messages
  for select to authenticated using (auth.uid() = user_id);
create policy "chat_insert_own" on public.chat_messages
  for insert to authenticated with check (auth.uid() = user_id);
```

> ลิมิต 10/วันบังคับใน Netlify Function (นับก่อนเรียก Gemini) — RLS ไม่ได้บังคับจำนวน แต่กันไม่ให้เห็นแชทคนอื่น

### payments (เจ้าของแถว + admin verify) — จุดสำคัญตาม #13

```sql
-- เจ้าของอ่าน payment ของตัวเอง / admin อ่านทุกแถว
create policy "payments_select_own_or_admin" on public.payments
  for select to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- user สร้าง payment (pending) ของตัวเองได้
create policy "payments_insert_own" on public.payments
  for insert to authenticated with check (auth.uid() = user_id);

-- user อัปเดตแถวตัวเองได้เฉพาะตอนอัปสลิป (pending → submitted) ห้ามตั้ง verified เอง
create policy "payments_update_own_submit" on public.payments
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status in ('pending','submitted'));

-- admin อัปเดตได้ทุกแถว (verify/reject → ตั้ง verified/rejected + verified_by)
create policy "payments_update_admin" on public.payments
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
```

> การ flip `profiles.is_premium` + เซ็ต `premium_until` ตอน verify แนะนำทำใน **function `security definer` / service role** (แถว payments อยู่คนละตารางกับ profiles) — admin กด verify แล้ว function เดียวอัปเดตทั้ง payment และ profile แบบ atomic

### activity_log (เจ้าของ insert/select; aggregate ไปทาง view)

```sql
create policy "activity_insert_own" on public.activity_log
  for insert to authenticated with check (auth.uid() = user_id);
create policy "activity_select_own_or_admin" on public.activity_log
  for select to authenticated using (auth.uid() = user_id or public.is_admin());
```

> DAU ที่โชว์ /stats มาจาก view `public_stats.dau_today` (bypass RLS) — raw log ไม่เปิด public

### friendships + push_subscriptions (Wave 2)

```sql
create policy "friend_select_involved" on public.friendships
  for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "friend_insert_own" on public.friendships
  for insert to authenticated with check (auth.uid() = requester_id);
create policy "friend_update_involved" on public.friendships
  for update to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "push_all_own" on public.push_subscriptions
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

---

## Storage bucket: `payment-slips` (ตาม #13)

```sql
-- สร้าง bucket แบบ private (ไม่ public)
insert into storage.buckets (id, name, public)
values ('payment-slips', 'payment-slips', false)
on conflict (id) do nothing;
```

**RLS บน storage.objects** — ตั้งชื่อไฟล์เป็น `{user_id}/{payment_id}.jpg` เพื่อผูกเจ้าของกับ path:

```sql
-- user อัปโหลดสลิปเข้าโฟลเดอร์ของตัวเอง (prefix = uid)
create policy "slips_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-slips'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- อ่านสลิปได้เฉพาะเจ้าของไฟล์ หรือ admin (เจ้าของดูตอน verify)
create policy "slips_select_own_or_admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-slips'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
```

> bucket เป็น private → เข้าถึงรูปผ่าน signed URL (สร้างจาก backend ตอน admin เปิดหน้า verify) ต้นทุน 0 (Supabase free tier)

---

## การบังคับ active roadmap limit (ฟรี 1 / premium หลาย)

บังคับ **2 ชั้น** (defense in depth):

1. **App logic (ชั้นหลัก, UX)** — ก่อนเปิด roadmap ใหม่ frontend/function เช็ค `is_premium` + จำนวน active; ถ้าฟรีและมี active แล้ว → แสดง upsell sheet (#13 trigger 1) แทนการสร้าง ไม่โยน error ดิบใส่หน้าผู้ใช้
2. **DB trigger `enforce_active_roadmap_limit` (ชั้นกัน bug/abuse)** — ข้อ 3 ข้างบน raise `FREE_PLAN_ACTIVE_ROADMAP_LIMIT` ถ้า client พยายาม insert/activate เกิน. app จับ error นี้แปลงเป็นข้อความชวนอัปเกรด

> RLS **ไม่ใช่** ที่บังคับ limit (RLS ทำ count เชิงเงื่อนไขแบบนี้ได้ลำบากและแพง) — ใช้ trigger + app logic คู่กัน ตามที่ ticket ถาม ("บังคับที่ไหน")

---

## Seed data: starter_quests 18 ชุด (โครง)

Seed topics ก่อน แล้วค่อย seed starter_quests (6 topic × 3 level). `content`/`checklist` เป็น jsonb — ด้านล่างเป็น **โครงตัวอย่าง** ให้ effort ถัดไปเติมเนื้อจริงจาก [thai-lesson-sources.md](thai-lesson-sources.md)

```sql
-- 1) topics (6 หัวข้อ curated ตาม #02)
insert into public.topics (slug, title, description, sort_order) values
  ('python',   'Python เริ่มจากศูนย์',        'เขียนโปรแกรม Python ตั้งแต่ 0',        1),
  ('data-ml',  'Data/ML',                     'วิเคราะห์ข้อมูล + Machine Learning',   2),
  ('web',      'สร้างเว็บ (HTML/CSS/JS)',      'ทำเว็บของตัวเองตั้งแต่พื้นฐาน',        3),
  ('ai-tools', 'ใช้ AI ให้เป็น',              'prompt + เครื่องมือ AI ในการทำงาน',    4),
  ('excel',    'Excel/Google Sheets',         'ตาราง สูตร วิเคราะห์ข้อมูลงานจริง',    5),
  ('finance',  'การเงินส่วนบุคคล',            'วางแผนเงิน ออม ลงทุนเบื้องต้น',        6)
on conflict (slug) do nothing;

-- 2) starter_quests — โครง 18 แถว (topic × level). เนื้อ content/checklist เติมทีหลัง
-- ตัวอย่าง 1 หัวข้อ (python) ครบ 3 ระดับ — ทำแพทเทิร์นเดียวกันให้ครบ 6 หัวข้อ = 18 แถว
insert into public.starter_quests (topic_id, level, title, description, xp_reward, content, checklist)
select t.id, v.level, v.title, v.description, 10, '{}'::jsonb, '[]'::jsonb
from public.topics t
join (values
  ('python','beginner',     'เควสแรก: ติดตั้ง Python + พิมพ์ "สวัสดี"', 'รู้จัก Python แล้วรันโค้ดแรกใน Colab'),
  ('python','intermediate', 'เควสแรก: ทบทวนตัวแปร + เขียน loop สั้น ๆ',  'วอร์มพื้นฐานที่พอมีอยู่แล้วให้แน่น'),
  ('python','advanced',     'เควสแรก: เขียนฟังก์ชัน + จัดการ error',      'ต่อยอดสำหรับคนเขียนเป็นแล้ว')
) as v(slug, level, title, description) on t.slug = v.slug
on conflict (topic_id, level) do nothing;
```

> **TODO effort ถัดไป**: เติม starter_quests อีก 5 หัวข้อ × 3 ระดับ (data-ml, web, ai-tools, excel, finance) ให้ครบ 18 แถว + ใส่ `content`/`checklist` จริงอิงแหล่งเรียนไทยใน `thai-lesson-sources.md` (แต่ละ checklist ลิงก์ได้เฉพาะหน้าหลักโดเมน whitelist/ลิงก์ค้นหา ตาม guardrail #02)

---

## ลำดับการรัน (ตอน implement)

1. extension + `is_admin()` helper
2. `profiles` + trigger `handle_new_user`
3. `topics`
4. `starter_quests` (ก่อน daily_quests เพราะ FK)
5. `roadmaps` + trigger limit → `phases` → `daily_quests` → `quest_checklist_items`
6. `quest_completions`, `referrals`, `chat_messages`
7. `payments` + `activity_log`
8. Wave 2: `friendships`, `push_subscriptions`
9. Views (leaderboard, public_stats, stats_daily_growth) + grants
10. เปิด RLS + policies ทุกตาราง
11. Storage bucket `payment-slips` + policies
12. Seed: topics + starter_quests
13. **หลัง deploy**: `update profiles set is_admin = true where id = '<owner-uuid>'` (bootstrap admin คนแรก)

---

## จุดที่เจ้าของควรรีวิว

1. **ID admin คนแรก** — ต้อง bootstrap ด้วยมือ (ข้อ 13). ถ้าไม่อยากใช้คอลัมน์ `is_admin` เปลี่ยนเป็น hardcode uuid ใน `is_admin()` ได้
2. **การเขียนผ่าน service role** — flip `is_premium`, ให้ XP referral, insert daily_quests (pre-generate), verify payment ทั้งหมดต้องทำใน Netlify Function ที่ถือ **service_role key** (bypass RLS). ต้องเก็บ key นี้เป็น env server-side เท่านั้น ห้ามหลุดไป client
3. **`checked_items` เป็น snapshot ไม่ใช่ per-item table** — ถ้าอยากได้ analytics ระดับ "ข้อไหนคนติ๊ก/ไม่ติ๊กบ่อย" ต้องเพิ่มตาราง; ตอนนี้ตัดเพื่อความง่าย
4. **leaderboard/stats เป็น view bypass RLS** — ยืนยันว่าคอลัมน์ที่เลือกไม่มี PII เกิน (display_name/avatar มาจาก Google ผู้ใช้ยินยอมโดยปริยายจากการเล่น; opt-out มีให้แล้ว). ถ้ากรรมการซีเรียส privacy อาจเปลี่ยนเป็น RPC function
5. **auto-expire premium ยังไม่มี** (เลื่อนตาม #13) — `premium_until` เก็บไว้ก่อน; **รายเดือน runway สั้น** ต้องทำ cron flip กลับภายใน ~1 เดือนหลังเปิด premium ไม่งั้น premium กลายเป็นฟรีตลอดชีพ
6. **`activity_log` event_type เป็น text อิสระ** — ควร lock รายการ event_type ที่จะเก็บให้ชัดตอน implement (login/quest_complete/chat/roadmap_start/share/referral_signup/premium_submit) เพื่อ query ตรงกัน
7. **scheduled pre-generate ต้อง idempotent** — unique `(roadmap_id, day_number)` กันซ้ำแล้ว แต่ function ต้อง handle conflict แบบ reuse (บทเรียนจาก ml-quest ที่ยิงพร้อมกันหลายแท็บ)
```
