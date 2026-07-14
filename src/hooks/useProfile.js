import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

// ดึงโปรไฟล์ + roadmaps จาก /.netlify/functions/me — ใช้ session จาก useAuth() เป็น input (ไม่ผูก auth listener ซ้ำ)
//
// ข้อควรรู้สำหรับผู้เรียกใช้:
// - refetch ทุกครั้งสร้าง object/array ใหม่เสมอ (JSON ใหม่จาก network) — effect ฝั่งผู้เรียกห้าม depend กับ
//   `activeRoadmap`/`roadmaps` ตรง ๆ ให้ใช้ `activeRoadmapId` (primitive เสถียร) ที่ hook เตรียมให้แทน
// - `error` ต้องเช็คก่อนตีความ "ไม่มี roadmap" — ตอน /me ล้มเหลว roadmaps ว่างเพราะโหลดไม่สำเร็จ
//   ไม่ใช่เพราะผู้ใช้ยังไม่เคย onboard (เด้ง redirect ผิดหน้าได้)
export function useProfile(session) {
  const [profile, setProfile] = useState(null);
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = session?.access_token ?? null;

  const refetch = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.me(token);
      setProfile(data.profile);
      setRoadmaps(data.roadmaps ?? []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      refetch();
    } else {
      setProfile(null);
      setRoadmaps([]);
      setLoading(false);
    }
  }, [token, refetch]);

  // merge ฟิลด์ที่ API อื่นตอบกลับมาแล้ว (เช่น complete-quest ให้ total_xp/streak/grade ครบ)
  // เข้า state ตรง ๆ — ถูกกว่ายิง /me เต็ม ๆ ซ้ำทั้งที่ข้อมูลอยู่ในมือแล้ว
  const patchProfile = useCallback((fields) => {
    setProfile((p) => (p ? { ...p, ...fields } : p));
  }, []);

  const activeRoadmap = roadmaps.find((r) => r.is_active) ?? null;
  const activeRoadmapId = activeRoadmap?.id ?? null;

  return { profile, roadmaps, activeRoadmap, activeRoadmapId, loading, error, refetch, patchProfile };
}
