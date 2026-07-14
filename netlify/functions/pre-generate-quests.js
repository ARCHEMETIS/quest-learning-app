// Scheduled Function — pre-generate เควสรายวันตอนกลางคืน (cron ใน netlify.toml)
// batch เล็กหยิบจากคิวใน Supabase ทีละ 2-3 → จบใน <10 วิ (deploy-plan.md sec.3)
// STUB: ลอจิกคิว/generate/cache เสียบใน ticket #08 (scheduled-pregenerate)
export default async () => {
  // TODO(#08): ดึงงานจากคิว → gemini.generate → เขียน cache → mark done
  return new Response(JSON.stringify({ ok: true, note: 'stub — ticket #08' }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
