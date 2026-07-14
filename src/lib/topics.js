import { supabase } from './supabaseClient.js';

// id ที่ OnboardingFlow.jsx (เพื่อน) ใช้ในการ์ดเลือกหัวข้อ -> slug จริงใน supabase-schema.md #02
// ต่างกันแค่ "ai" (การ์ดเพื่อน) vs "ai-tools" (slug จริง) ตัวอื่นตรงกันอยู่แล้ว
export const TOPIC_ID_TO_SLUG = {
  python: 'python',
  'data-ml': 'data-ml',
  web: 'web',
  ai: 'ai-tools',
  excel: 'excel',
  finance: 'finance',
};

// id ที่ OnboardingFlow.jsx ใช้ในการ์ดระดับพื้นฐาน -> level enum จริงที่ backend รับ (start-roadmap.js/generate-quest.js)
export const LEVEL_ID_TO_LEVEL = {
  beginner: 'beginner',
  some: 'intermediate',
  solid: 'advanced',
};

let cachedTopics = null;

// topics_select_all (RLS) เปิดให้ anon+authenticated อ่านหัวข้อ active ได้ — cache ไว้กันยิงซ้ำทุกครั้งที่เข้า onboarding
export async function fetchTopics() {
  if (cachedTopics) return cachedTopics;
  const { data, error } = await supabase
    .from('topics')
    .select('id, slug, title')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  cachedTopics = data ?? [];
  return cachedTopics;
}
