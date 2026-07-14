import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

// Auth state ต้องมาจาก provider เดียว (mount ที่ App เท่านั้น) — ถ้าแต่ละหน้าเรียก useAuth ของตัวเอง
// จะมีช่วง session=null สั้น ๆ ก่อน getSession() แรกของหน้านั้น resolve เอง ทำให้หน้าที่เช็ค "ยังไม่มี roadmap"
// อ่านค่าเก่าผิดจังหวะแล้ว redirect วนไม่หยุด (พบจริงตอนทดสอบ #09) — ต้อง share ผ่าน context แทน
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      // ต้องส่ง redirectTo เสมอ ไม่งั้นเด้งกลับ Site URL (localhost จะพัง) — deploy-plan.md sec.7
      options: { redirectTo: window.location.origin },
    });

  const signOut = () => supabase.auth.signOut();

  const value = { session, user: session?.user ?? null, loading, signInWithGoogle, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth ต้องถูกเรียกใต้ <AuthProvider>');
  return ctx;
}
