// POST /.netlify/functions/generate-quest — onboarding เส้นทางหัวข้อพิมพ์อิสระ (generate สดด้วย Gemini, #07)
// body: { topic_title, level: beginner|intermediate|advanced, minutes_per_day: 15|30|60 }
// หัวข้อ curated (มี topic_id) ไปทาง /start-roadmap แทน — ไม่กินโควต้า Gemini (#06)
import { requireUser, unauthorized, json } from './_shared/auth.js';
import { getAdminClient } from './_shared/supabaseAdmin.js';
import { createFreeformRoadmap, FREE_PLAN_LIMIT_MESSAGE } from './_shared/questGenerator.js';
import { checkTopicText, TOPIC_REJECT_CODE, TOPIC_REJECT_MESSAGE } from './_shared/topicModeration.js';

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const MINUTES = [15, 30, 60];
const MAX_TOPIC_TITLE_LEN = 80;

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method Not Allowed' });

  const { user } = await requireUser(req);
  if (!user) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const topicTitle = String(body.topic_title || '').trim();
  const level = body.level;
  const minutesPerDay = body.minutes_per_day;

  if (!topicTitle) return json(400, { error: 'ต้องระบุหัวข้อที่อยากเรียน (topic_title)' });
  if (topicTitle.length > MAX_TOPIC_TITLE_LEN) {
    return json(400, { error: `หัวข้อยาวเกินไป (ไม่เกิน ${MAX_TOPIC_TITLE_LEN} ตัวอักษร)` });
  }
  if (!LEVELS.includes(level)) return json(400, { error: 'level ต้องเป็น beginner/intermediate/advanced' });
  if (!MINUTES.includes(minutesPerDay)) return json(400, { error: 'minutes_per_day ต้องเป็น 15/30/60' });

  // ด่านกรองหัวข้อชั้นที่ 1 (บล็อกลิสต์) — ยิงก่อนแตะ Gemini เสมอ ไม่เสียโควตาฟรีไปกับหัวข้อที่รู้อยู่แล้วว่าไม่ผ่าน
  // ชั้นที่ 2 (โมเดลตัดสินตามบริบท) อยู่ใน createFreeformRoadmap — คืน error code เดียวกัน
  const moderation = checkTopicText(topicTitle);
  if (!moderation.ok) {
    console.warn(`[generate-quest] ปฏิเสธหัวข้อจากบล็อกลิสต์ (matched: ${moderation.matched}) user=${user.id}`);
    return json(400, { error: TOPIC_REJECT_MESSAGE, code: TOPIC_REJECT_CODE });
  }

  const admin = getAdminClient();

  try {
    const result = await createFreeformRoadmap(admin, {
      userId: user.id,
      topicTitle,
      level,
      minutesPerDay,
    });
    return json(200, result);
  } catch (err) {
    if (err.code === 'FREE_PLAN_ACTIVE_ROADMAP_LIMIT') {
      return json(409, { error: FREE_PLAN_LIMIT_MESSAGE, code: err.code });
    }
    if (err.code === 'FREE_PLAN_SAVED_ROADMAP_LIMIT') {
      return json(409, { error: err.message, code: err.code });
    }
    if (err.code === TOPIC_REJECT_CODE) {
      return json(400, { error: err.message, code: err.code });
    }
    return json(500, { error: String(err.message || err) });
  }
};
