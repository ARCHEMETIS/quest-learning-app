-- เปลี่ยนเกณฑ์ตัดเกรดใน RPC complete_quest จาก "วันติด (streak)" เป็น "XP รวม"
-- เหตุผล + ตารางเกณฑ์อยู่ที่ src/lib/gradeBands.js (F/D/C/B/A/S/SS/SSS)
-- ปลอดภัยกับข้อมูลเดิม: ไม่แตะแถวไหนเลย แค่แทนที่ฟังก์ชัน (create or replace) รันซ้ำได้
-- หมายเหตุ: grade ของโปรไฟล์ที่มีอยู่จะอัปเดตให้เองตอนผู้ใช้ทำเควสถัดไปสำเร็จ
create or replace function public.complete_quest(
  p_user_id       uuid,
  p_quest_id      uuid,
  p_roadmap_id    uuid,
  p_xp            integer,
  p_checked_items jsonb,
  p_today         date,      -- "วันนี้" ตามเวลาไทย คำนวณฝั่ง JS (bangkokDateStr)
  p_grade_bands   jsonb,     -- [{grade,min}, ...] เรียงจาก min น้อย→มาก
  p_metadata      jsonb      -- payload ของ activity_log event quest_complete
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile     record;
  v_existing_xp integer;
  v_new_streak  integer;
  v_new_longest integer;
  v_new_total   integer;
  v_grade       text;
begin
  -- idempotent: unique (user_id, quest_id) — double-submit/race แทรกซ้ำจะ conflict แล้วข้าม
  insert into public.quest_completions (user_id, quest_id, roadmap_id, xp_earned, checked_items)
  values (p_user_id, p_quest_id, p_roadmap_id, p_xp, p_checked_items)
  on conflict (user_id, quest_id) do nothing;

  if not found then
    -- ทำเควสนี้ไปแล้ว (แทนที่ handler 23505 เดิมใน complete-quest.js) — คืนค่าปัจจุบัน ไม่แจก XP ซ้ำ
    select xp_earned into v_existing_xp
    from public.quest_completions
    where user_id = p_user_id and quest_id = p_quest_id;

    select total_xp, current_streak, longest_streak, grade
    into v_profile
    from public.profiles where id = p_user_id;

    return jsonb_build_object(
      'already_completed', true,
      'xp_earned', coalesce(v_existing_xp, p_xp),
      'total_xp', v_profile.total_xp,
      'current_streak', v_profile.current_streak,
      'longest_streak', v_profile.longest_streak,
      'grade', v_profile.grade
    );
  end if;

  -- lock แถว profile: ธุรกรรมอื่นที่แตะ total_xp (เควสขนาน/redeem_referral) ต้องรอคิว → ไม่มี lost update
  select total_xp, current_streak, longest_streak, last_quest_date
  into v_profile
  from public.profiles
  where id = p_user_id
  for update;

  -- streak logic เดียวกับ _shared/gameplay.js nextStreak (วันเดิม=คงเดิม, เมื่อวาน=+1, อื่น ๆ/null=เริ่ม 1)
  v_new_streak := case
    when v_profile.last_quest_date = p_today then v_profile.current_streak
    when v_profile.last_quest_date = p_today - 1 then v_profile.current_streak + 1
    else 1
  end;
  v_new_longest := greatest(v_profile.longest_streak, v_new_streak);

  -- grade = band ที่ min สูงสุดซึ่ง "XP รวมใหม่" ถึง (ตรรกะเดียวกับ computeGrade)
  -- เดิมตัดจาก streak — เปลี่ยนเป็น XP เมื่อ 23 ก.ค. 2026 (เหตุผลใน src/lib/gradeBands.js)
  select b->>'grade' into v_grade
  from jsonb_array_elements(p_grade_bands) b
  where (b->>'min')::integer <= (v_profile.total_xp + p_xp)
  order by (b->>'min')::integer desc
  limit 1;

  update public.profiles
  set total_xp        = total_xp + p_xp,
      current_streak  = v_new_streak,
      longest_streak  = v_new_longest,
      last_quest_date = p_today,
      last_active_at  = now(),
      grade           = coalesce(v_grade, grade)
  where id = p_user_id
  returning total_xp into v_new_total;

  insert into public.activity_log (user_id, event_type, metadata)
  values (p_user_id, 'quest_complete', p_metadata);

  return jsonb_build_object(
    'already_completed', false,
    'xp_earned', p_xp,
    'total_xp', v_new_total,
    'current_streak', v_new_streak,
    'longest_streak', v_new_longest,
    'grade', coalesce(v_grade, 'F')
  );
end;
$$;
