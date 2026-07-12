# โควต้า Gemini Free Tier (ก.ค. 2026) และกลยุทธ์ประหยัด AI

> Research asset ของ ticket [03-gemini-quota-research](../issues/03-gemini-quota-research.md) — ค้นเมื่อ 12 ก.ค. 2026

## ข้อเท็จจริงสำคัญที่สุดก่อน

1. **Google เลิกประกาศตัวเลขโควต้าเป็นสาธารณะแล้ว** — [เอกสารทางการ](https://ai.google.dev/gemini-api/docs/rate-limits) บอกแค่ "ดูได้ใน AI Studio" ตัวเลขจริงของ *โปรเจกต์เรา* ต้องเปิดดูที่ [AI Studio rate-limit dashboard](https://aistudio.google.com/rate-limit) (ใช้เวลา 5 นาที ทำตอนเริ่ม implement)
2. **โควต้านับต่อโปรเจกต์ ไม่ใช่ต่อ API key** — สร้างหลาย key ในโปรเจกต์เดียวไม่ช่วย และการเลี่ยงด้วยหลายโปรเจกต์เสี่ยงผิด ToS (ไม่ทำ)
3. **โควต้ารายวันรีเซ็ตเที่ยงคืน Pacific = ~14:00 น. เวลาไทย**
4. **ธ.ค. 2025 Google เคยหั่นโควต้าฟรี 50–80% แบบไม่บอกล่วงหน้า** → ห้ามออกแบบระบบที่ตายถ้าโควต้าเปลี่ยน ต้องมี fallback เสมอ
5. RPM / TPM / RPD เป็น 3 เพดานแยกกัน ชนอันไหนก่อนก็โดน 429 อันนั้น

## ตารางโควต้า (ตัวเลข third-party ล่าสุด — ใช้เป็น planning number, ยืนยันจริงใน dashboard)

| โมเดล | RPM | TPM | RPD | หมายเหตุ |
|---|---|---|---|---|
| `gemini-3-flash` | ~10 | ~250K | **~1,500** | มาต้นปี 2026 — โมเดลฟรีตัวเก่งที่ Google ดันให้ใช้ |
| `gemini-2.5-flash-lite` | ~15 | ~250K | **~1,000** | ถูกสุด/เร็วสุด เหมาะงานเบา |
| `gemini-2.5-flash` | ~10 | ~250K | **~250** | ตัวที่ ml-quest เดิมใช้ — โดนหั่นหนักสุดรอบ ธ.ค. 2025 |
| `gemini-3.5-flash`, `gemini-3.1-flash-lite` | ? | ? | ? | ขึ้นสถานะ free-capable แล้ว (มิ.ย. 2026) แต่ยังไม่มีตัวเลขยืนยัน — เช็คใน dashboard |
| `gemini-2.5-pro` / `3.1-pro` | — | — | — | Pro ถือว่าหมดสิทธิ์ใช้ฟรีจริงจัง (ทดลองได้จิ๋วมาก/ไม่ให้เลย) — ไม่เอาเข้าแผน |

**นัยสำคัญ:** แต่ละโมเดลมีถังโควต้าแยกกัน → ใช้หลายโมเดลเป็น chain ได้ รวมงบ ~2,500–2,750 calls/วัน

## จุดตายอยู่ตรงไหน

- **จุดตายหลักคือ RPM ไม่ใช่ RPD** — 10–15 req/นาที ถ้าผู้ใช้ 30 คนเปิดแอพพร้อมกันตอน 2 ทุ่มแล้วทุกคน trigger การ generate → 429 ทันที แม้โควต้าวันเหลือเยอะ
- RPD 250 ของ 2.5-flash ต่ำจนใช้เป็นโมเดลหลักไม่ได้แล้ว (ml-quest เดิมใช้ตัวนี้ — แอพใหม่ต้องย้าย)
- TPM 250K แทบไม่ใช่ปัญหาสำหรับงานสั้น ๆ ของเรา

## กลยุทธ์ (เรียงตามผลกระทบ)

### 1. Pre-generate + cache = ตัวคูณที่ใหญ่ที่สุด
- **Roadmap: generate ครั้งเดียวต่อ user×topic เก็บ Supabase ตลอดไป** (ของเดิมทำอยู่แล้ว — คงไว้)
- **เควสรายวัน: pre-generate ตอนกลางคืน** ด้วย Netlify Scheduled Function ไล่ generate เควสของผู้ใช้ active ทีละคน เกลี่ยข้ามช่วง 00:00–06:00 → RPM ไม่ใช่ข้อจำกัดอีกต่อไป (เกลี่ย 6 ชม. ที่ 10 RPM = เพดานทฤษฎี 3,600 calls) ตอนกลางวันผู้ใช้เปิดแอพ = อ่าน DB ล้วน เร็วและไม่กินโควต้า
- ทุกการ generate ต้อง idempotent: เช็ค DB ก่อนยิงเสมอ refresh หน้าไม่ยิงซ้ำ

### 2. แบ่งงานตามโมเดล (ถังแยกกัน)
| งาน | โมเดล | เหตุผล |
|---|---|---|
| Generate roadmap (นาน ๆ ครั้ง, ต้องฉลาด) | `gemini-3-flash` | คุณภาพสูงสุดที่ฟรี, RPD 1,500 เหลือเฟือ |
| เควสรายวัน (pre-generated) | `gemini-3-flash` หรือ `flash-lite` | ยิงตอนกลางคืน ไม่รีบ |
| แชท Quest Coach (real-time, ถี่) | `gemini-2.5-flash-lite` | ถังแยก 1,000/วัน, RPM สูงสุด (15) |

### 3. จำกัดแชทต่อคน/วัน
- เพดาน **10 ข้อความ/คน/วัน** (นับใน Supabase) — พอสำหรับถามการบ้าน และทำให้คำนวณ capacity ได้จริง เกินแล้วขึ้น "โค้ชพักก่อน พรุ่งนี้คุยต่อนะ" (ธีม quest ช่วยให้ limit ดูเป็นเกม ไม่ใช่ความจน)

### 4. Fallback chain เมื่อ 429
`gemini-3-flash` → `2.5-flash-lite` → `2.5-flash` → **static fallback** (เควสสำเร็จรูปจากคลังที่เขียนไว้ล่วงหน้า / ข้อความ "AI คิวเต็ม ลองใหม่อีก 1 นาที") — retry มี exponential backoff + jitter ใน Netlify Function ห้าม retry ทันทีเด็ดขาด

## รองรับผู้ใช้ active ได้กี่คน/วัน?

สมมติต่อ active user/วัน: เควส 1 call (pre-generated) + แชทเฉลี่ย ~3 calls (เพดาน 10) ≈ **~4 calls/คน/วัน**

| สถานการณ์ | ประมาณการ |
|---|---|
| แชทลง flash-lite ถังเดียว (1,000 RPD) | เควส pre-gen บน 3-flash + แชท ~300 คน×3 = **~250–330 active users/วัน** |
| ใช้เต็ม chain (~2,500 RPD รวม) | **~500–600 active users/วัน** |
| New user (roadmap 1 call แรกเข้า) | 1,500 RPD ของ 3-flash รับ user ใหม่หลักร้อย/วันสบาย |

สำหรับเป้าวิชาธุรกิจ (หลักสิบถึงร้อยต้น ๆ ของผู้ใช้จริงใน 1 เดือน) — **โควต้าฟรีเหลือเฟือ ถ้าทำ 4 ข้อบนครบ** ความเสี่ยงจริงมีอย่างเดียวคือ Google หั่นโควต้ากลางทางอีก ซึ่ง fallback chain + static fallback ปิดความเสี่ยงนั้นแล้ว

## สิ่งที่ต้องทำตอน implement (ไม่ใช่ตอนนี้)

- [ ] เปิด [AI Studio dashboard](https://aistudio.google.com/rate-limit) ยืนยันตัวเลขจริงของโปรเจกต์ + เช็คว่า `gemini-3.5-flash` / `3.1-flash-lite` ให้โควต้าเท่าไหร่ อาจดีกว่าที่วางแผนไว้
- [ ] เขียนคลังเควสสำเร็จรูป (static fallback) อย่างน้อยหัวข้อละ 3–5 เควส

## แหล่งอ้างอิง

- [Rate limits — เอกสารทางการ](https://ai.google.dev/gemini-api/docs/rate-limits) (ไม่มีตัวเลขแล้ว ชี้ไป dashboard)
- [AI Free API — Free Tier Rate Limits 2026](https://www.aifreeapi.com/en/posts/gemini-api-free-tier-rate-limits) (ตาราง + เรื่องหั่นโควต้า ธ.ค. 2025)
- [LaoZhang — Gemini API Key Free in 2026](https://blog.laozhang.ai/en/posts/gemini-api-free-tier) (รายชื่อโมเดล free-capable มิ.ย. 2026)
- [TokenMix — Gemini Free Tier](https://tokenmix.ai/blog/gemini-api-free-tier-limits) (ตัวเลขชุดเก่า — ใช้เทียบว่าตัวเลขไม่นิ่ง)
- [pecollective — Gemini Free Tier Guide](https://pecollective.com/tools/gemini-free-tier-guide/) (ตัวเลข gemini-3-flash)
