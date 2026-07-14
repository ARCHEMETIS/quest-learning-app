// POST /.netlify/functions/switch-roadmap — สลับหัวข้อที่ active (progress หัวข้อเดิมเก็บไว้ครบ ไม่หาย)
// body: { roadmap_id } — ต้องเป็น roadmap ของผู้ใช้เอง; สลับหัวข้อเดิมที่พักไว้ไม่มีเพดาน (เพดานฟรี 3 หัวข้อ
// นับเฉพาะตอน "สร้างใหม่" ใน start-roadmap / generate-quest เท่านั้น)
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

  const { data: target, error: targetErr } = await admin
    .from('roadmaps')
    .select(ROADMAP_COLS)
    .eq('id', roadmapId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (targetErr) return json(500, { error: targetErr.message });
  if (!target) return json(404, { error: 'ไม่พบ roadmap นี้' });
  if (target.status === 'failed') {
    return json(400, { error: 'roadmap นี้สร้างไม่สำเร็จตั้งแต่แรก — เริ่มหัวข้อใหม่แทนได้เลย' });
  }
  if (target.is_active) return json(200, { roadmap: target, switched: false });

  // พักตัว active เดิมก่อนค่อยเปิดตัวใหม่ — ลำดับนี้สำคัญ ไม่งั้นชน DB trigger enforce_active_roadmap_limit (ฟรี active ได้ 1)
  const { error: pauseErr } = await admin
    .from('roadmaps')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('is_active', true);
  if (pauseErr) return json(500, { error: pauseErr.message });

  const { data: activated, error: actErr } = await admin
    .from('roadmaps')
    .update({ is_active: true })
    .eq('id', target.id)
    .select(ROADMAP_COLS)
    .single();
  if (actErr) return json(500, { error: actErr.message });

  await admin.from('activity_log').insert({
    user_id: user.id,
    event_type: 'roadmap_switch',
    metadata: { roadmap_id: target.id, topic_title: target.topic_title },
  });

  return json(200, { roadmap: activated, switched: true });
};
