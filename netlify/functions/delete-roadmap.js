// POST /.netlify/functions/delete-roadmap — ลบหัวข้อที่ไม่เอาแล้วทิ้งถาวร (คืนโควตาเพดานฟรี 3 หัวข้อ)
// body: { roadmap_id } — ต้องเป็น roadmap ของผู้ใช้เอง; เช็ค user_id ก่อนลบเสมอ ไม่งั้นใครก็ยิง id ของคนอื่นมาลบข้อมูลได้
// ลบแถวเดียวใน roadmaps พอ — FK ใน schema.sql เป็น on delete cascade ครบสาย:
//   phases / daily_quests / quest_completions / chat_messages -> roadmaps
//   quest_checklist_items -> daily_quests
// activity_log ไม่มี FK ไป roadmaps เลย (มีแค่ user_id, roadmap_id อยู่ใน metadata jsonb) → ประวัติ metric
// ของหัวข้อที่ถูกลบยังอยู่ครบ ไม่ถูก cascade ตามไปด้วย (ตัวเลขโตของวิชาธุรกิจต้องไม่หาย)
import { requireUser, unauthorized, json } from './_shared/auth.js';
import { getAdminClient } from './_shared/supabaseAdmin.js';

const ROADMAP_COLS = 'id, topic_id, topic_title, level, minutes_per_day, is_active, status, created_at';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method Not Allowed' });

  const { user } = await requireUser(req);
  if (!user) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const roadmapId = body.roadmap_id;
  if (!roadmapId) return json(400, { error: 'ต้องระบุ roadmap_id' });

  const admin = getAdminClient();

  // ★ จุดสำคัญที่สุดของ endpoint นี้: ยืนยันว่า roadmap เป็นของผู้เรียกจริง ๆ ก่อนแตะอะไรทั้งนั้น
  // (service-role client ข้าม RLS ทั้งหมด — ถ้าไม่กรอง user_id ตรงนี้เท่ากับเปิดให้ลบข้อมูลคนอื่น)
  const { data: target, error: targetErr } = await admin
    .from('roadmaps')
    .select('id, topic_title, is_active')
    .eq('id', roadmapId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (targetErr) return json(500, { error: targetErr.message });
  if (!target) return json(404, { error: 'ไม่พบ roadmap นี้' });

  // eq('user_id') ซ้ำอีกชั้นตอนลบจริง — กันพลาดถ้าโค้ดข้างบนถูกแก้ในอนาคตจนหลุด guard
  const { error: delErr } = await admin
    .from('roadmaps')
    .delete()
    .eq('id', target.id)
    .eq('user_id', user.id);
  if (delErr) return json(500, { error: delErr.message });

  // อ่านสภาพหลังลบมาใช้ทั้งตัดสินใจเลื่อนหัวข้อ active และตอบกลับให้ drawer อัพเดตตัวเอง
  const { data: after, error: afterErr } = await admin
    .from('roadmaps')
    .select(ROADMAP_COLS)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true }); // เรียงเหมือน me.js เพื่อให้ drawer เรียงเหมือนเดิมเป๊ะ
  if (afterErr) return json(500, { error: afterErr.message });

  let roadmaps = after ?? [];
  // ลบหัวข้อที่กำลังลุยอยู่ = เหลือบัญชีที่ไม่มี active เลย ซึ่ง Quest.jsx ตีความว่า "ยังไม่เคย onboard"
  // แล้วเด้งไป /onboarding ทั้งที่ผู้ใช้ยังมีหัวข้ออื่นเก็บไว้ → เลื่อนหัวข้อที่เหลือขึ้นมา active แทน
  // เลือกอันที่สร้างล่าสุด (ความสนใจล่าสุดของผู้ใช้) และข้าม status='failed' เพราะเรียนต่อไม่ได้อยู่แล้ว
  // (พรีเมียมมี active ได้หลายอัน — ถ้ายังเหลือ active อยู่ ไม่ต้องเลื่อนอะไร)
  const usable = roadmaps.filter((r) => r.status !== 'failed');
  if (!roadmaps.some((r) => r.is_active) && usable.length > 0) {
    const promote = usable[usable.length - 1];
    const { data: promoted, error: promoteErr } = await admin
      .from('roadmaps')
      .update({ is_active: true })
      .eq('id', promote.id)
      .eq('user_id', user.id)
      .select(ROADMAP_COLS)
      .single();
    // ลบสำเร็จไปแล้ว (ย้อนไม่ได้) — ถ้าเลื่อน active พลาด ห้ามตอบ 500 หลอกว่า "ลบไม่สำเร็จ"
    // ตอบสถานะจริงไปแทน แล้วผู้ใช้กดสลับหัวข้อเองใน drawer ได้ปกติ
    if (promoteErr) console.error('[delete-roadmap] เลื่อนหัวข้อถัดไปเป็น active ไม่สำเร็จ', promoteErr);
    else roadmaps = roadmaps.map((r) => (r.id === promoted.id ? promoted : r));
  }

  // metric การเลิกเรียนหัวข้อ (churn ระดับหัวข้อ) — เก็บ topic_title ลง metadata ไว้ด้วยเพราะแถว roadmap
  // หายไปแล้ว ไม่มีทาง join กลับไปหาชื่อได้อีก
  await admin.from('activity_log').insert({
    user_id: user.id,
    event_type: 'roadmap_delete',
    metadata: { roadmap_id: target.id, topic_title: target.topic_title, was_active: target.is_active },
  });

  return json(200, {
    deleted_id: target.id,
    roadmaps,
    active_roadmap_id: roadmaps.find((r) => r.is_active)?.id ?? null,
  });
};
