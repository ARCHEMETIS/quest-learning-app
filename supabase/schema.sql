-- ============================================================
--  ลุยเควส (LuiQuest) — Supabase schema (ticket #03 / build-wave1)
--  ที่มา: .scratch/app-v2-spec/assets/supabase-schema.md
--  รันทั้งไฟล์ใน Supabase SQL Editor (project luiquest)
--  14 ตาราง + 3 view + RLS ทุกตาราง + bucket payment-slips
--  bootstrap admin: update profiles set is_admin=true where id='<owner-uuid>'
-- ============================================================

create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- อนุญาตให้สร้างฟังก์ชันที่อ้างถึงตารางที่ยังไม่ถูกสร้าง (is_admin อ้าง profiles) ในไฟล์เดียว
set check_function_bodies = false;

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

create table public.topics (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,     -- python | data-ml | web | ai-tools | excel | finance
  title        text not null,            -- ชื่อไทยแสดงผล
  description  text,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

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
  source_starter_id uuid,  -- FK ไป starter_quests ย้ายไปเพิ่มด้วย alter ท้ายไฟล์ (starter_quests สร้างทีหลัง)
  created_at     timestamptz not null default now(),
  unique (roadmap_id, day_number)         -- กันสร้างซ้ำตอน pre-generate ยิงพร้อมกัน (บทเรียนจาก ml-quest)
);

create index idx_daily_quests_roadmap on public.daily_quests(roadmap_id);
create index idx_daily_quests_date on public.daily_quests(scheduled_date);

create table public.quest_checklist_items (
  id           uuid primary key default gen_random_uuid(),
  quest_id     uuid not null references public.daily_quests(id) on delete cascade,
  order_index  integer not null default 0,
  label        text not null,
  link_url     text,                     -- ลิงก์แหล่งเรียน (whitelist/ค้นหาเท่านั้น ตาม #02)
  created_at   timestamptz not null default now()
);

create index idx_checklist_quest on public.quest_checklist_items(quest_id);

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

-- FK ของ daily_quests.source_starter_id (เพิ่มตรงนี้เพราะ daily_quests สร้างก่อน starter_quests)
alter table public.daily_quests
  add constraint daily_quests_source_starter_fk
  foreign key (source_starter_id) references public.starter_quests(id) on delete set null;

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

create table public.activity_log (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  event_type  text not null,   -- login | quest_complete | chat | roadmap_start | share | referral_signup | premium_submit ...
  metadata    jsonb,           -- payload เสริม (เช่น topic, quest_id) — optional
  created_at  timestamptz not null default now()  -- ★ ต้องมีตั้งแต่ deploy วันแรก ไม่งั้นกราฟ DAU ย้อนหลังหาย
);

create index idx_activity_user_date on public.activity_log(user_id, created_at);
create index idx_activity_type_date on public.activity_log(event_type, created_at);

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

grant select on public.public_stats     to anon, authenticated;  -- /stats เปิดสาธารณะ (อาจารย์เปิดลิงก์ดูได้)
grant select on public.stats_daily_growth to anon, authenticated;
grant select on public.leaderboard       to authenticated;        -- leaderboard เฉพาะคนล็อกอิน
revoke select on public.leaderboard      from anon;               -- default privileges แอบให้ anon อ่าน view ได้ ต้อง revoke ทิ้ง (เจอตอน verify ticket 03)

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

create policy "topics_select_all" on public.topics
  for select to anon, authenticated using (is_active);

create policy "starter_quests_select_all" on public.starter_quests
  for select to anon, authenticated using (true);  -- ต้องอ่านได้ตอน onboarding

create policy "topics_write_admin" on public.topics
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "starter_quests_write_admin" on public.starter_quests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

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

create policy "completions_select_own" on public.quest_completions
  for select to authenticated using (auth.uid() = user_id);

create policy "completions_insert_own" on public.quest_completions
  for insert to authenticated with check (auth.uid() = user_id);
-- ไม่มี update/delete policy → ทำเควสเสร็จแล้วแก้ประวัติไม่ได้ (metric สะอาด)

create policy "referrals_select_involved" on public.referrals
  for select to authenticated
  using (auth.uid() = referrer_id or auth.uid() = referred_id);
-- insert/update ไม่เปิดให้ client — ทำผ่าน service role function (ให้ XP ทั้งคู่, กันปั๊ม)

create policy "chat_select_own" on public.chat_messages
  for select to authenticated using (auth.uid() = user_id);
create policy "chat_insert_own" on public.chat_messages
  for insert to authenticated with check (auth.uid() = user_id);

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

create policy "activity_insert_own" on public.activity_log
  for insert to authenticated with check (auth.uid() = user_id);
create policy "activity_select_own_or_admin" on public.activity_log
  for select to authenticated using (auth.uid() = user_id or public.is_admin());

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

-- สร้าง bucket แบบ private (ไม่ public)
insert into storage.buckets (id, name, public)
values ('payment-slips', 'payment-slips', false)
on conflict (id) do nothing;

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

